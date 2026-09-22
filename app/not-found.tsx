import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo variant="emblem" className="w-16" />
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.14em] text-cyan-600 uppercase">
          Erreur 404
        </p>
        <h1 className="text-foreground text-2xl font-semibold">Page introuvable</h1>
        <p className="text-muted-foreground max-w-sm text-sm">
          La page demandée n'existe pas ou a été déplacée.
        </p>
      </div>
      <Button asChild>
        <Link href="/">Retour à l'accueil</Link>
      </Button>
    </main>
  );
}
