import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { LoginForm } from "@/components/auth/login-form";
import { ORG_NAME } from "@/lib/constants/app";

export const metadata: Metadata = {
  title: "Connexion - Espace administration",
  robots: { index: false, follow: false },
};

export default async function LoginPage(props: PageProps<"/connexion">) {
  const sp = await props.searchParams;
  const callbackUrl = typeof sp.callbackUrl === "string" ? sp.callbackUrl : "/admin";

  return (
    <main className="bg-muted/40 flex min-h-screen flex-col">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <Link href="/" aria-label="Retour au site public">
              <Logo variant="emblem" className="w-20" priority />
            </Link>
            <div className="space-y-1">
              <h1 className="text-foreground text-2xl font-semibold">Espace administration</h1>
              <p className="text-muted-foreground text-sm">{ORG_NAME}</p>
            </div>
          </div>

          <div className="border-border rounded-2xl border bg-white p-6 shadow-[0_20px_60px_-40px_rgba(26,13,144,0.35)] sm:p-8">
            <LoginForm callbackUrl={callbackUrl} />
          </div>

          <p className="text-muted-foreground text-center text-xs">
            Accès réservé aux membres habilités du FJCS. Toute connexion est journalisée.
          </p>
        </div>
      </div>
    </main>
  );
}
