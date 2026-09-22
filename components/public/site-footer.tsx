import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { PUBLIC_NAV } from "@/lib/constants/navigation";
import { ORG_ACRONYM, ORG_COMMISSION, ORG_NAME } from "@/lib/constants/app";

export function SiteFooter() {
  return (
    <footer className="border-border bg-muted/40 mt-auto border-t">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo variant="wordmark" className="h-12" />
          <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
            <span className="text-foreground font-semibold">{ORG_ACRONYM}</span> - {ORG_NAME}.
            Plateforme de recensement et de connaissance de la jeunesse, portée par la{" "}
            {ORG_COMMISSION}.
          </p>
          <Logo org="ctni" variant="wordmark" className="h-12" />
        </div>

        <nav aria-label="Liens du pied de page" className="space-y-3">
          <h2 className="text-foreground text-sm font-semibold tracking-wide uppercase">
            Navigation
          </h2>
          <ul className="space-y-2">
            {PUBLIC_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-3">
          <h2 className="text-foreground text-sm font-semibold tracking-wide uppercase">
            Protection des données
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Vos informations sont collectées avec votre consentement, utilisées uniquement par le
            FJCS et ne sont jamais publiées individuellement.
          </p>
          <Link
            href="/confidentialite"
            className="text-primary text-sm font-medium underline-offset-4 hover:underline"
          >
            Lire la politique de confidentialité
          </Link>
        </div>
      </div>
      <div className="border-border border-t">
        <div className="container-page text-muted-foreground flex flex-col gap-2 py-5 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {ORG_NAME}. Tous droits réservés.
          </p>
          <Link href="/admin" className="hover:text-foreground">
            Espace administration
          </Link>
        </div>
      </div>
    </footer>
  );
}
