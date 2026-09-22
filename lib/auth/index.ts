import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/schemas/auth";
import { authConfig } from "./config";
import { verifyPassword } from "./password";
import { audit } from "@/services/audit.service";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });
        // Comparaison systématique pour éviter les attaques temporelles / énumération.
        const dummyHash = "$2a$12$CwTycUXWue0Thq9StjUM0uJ8b1V0z6Zz1ZjQ3YQ5Q5Q5Q5Q5Q5Q5Q";
        const valid = await verifyPassword(password, user?.passwordHash ?? dummyHash);

        if (!user || !user.isActive) return null;

        if (user.lockedUntil && user.lockedUntil > new Date()) {
          return null;
        }

        if (!valid) {
          const attempts = user.failedLoginAttempts + 1;
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: attempts,
              lockedUntil:
                attempts >= MAX_FAILED_ATTEMPTS
                  ? new Date(Date.now() + LOCK_MINUTES * 60_000)
                  : null,
            },
          });
          await audit({ action: "LOGIN_FAILED", entityType: "User", entityId: user.id });
          return null;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
        });
        await audit({
          action: "LOGIN_SUCCESS",
          entityType: "User",
          entityId: user.id,
          actorId: user.id,
        });

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
});
