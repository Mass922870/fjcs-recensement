import type { NextAuthConfig } from "next-auth";
import { getAuthSecret } from "@/lib/env";

/**
 * Configuration Auth.js partagée entre le proxy (sans accès base) et le
 * serveur (avec le provider Credentials). Sessions JWT httpOnly, 8 heures.
 */
export const authConfig = {
  secret: getAuthSecret(),
  pages: {
    signIn: "/connexion",
    error: "/connexion",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
    updateAge: 30 * 60,
  },
  trustHost: true,
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? token.sub ?? "";
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
