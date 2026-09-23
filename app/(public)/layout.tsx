import { SiteHeader } from "@/components/public/site-header";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { getGaMeasurementId } from "@/lib/analytics";
import { SiteFooter } from "@/components/public/site-footer";

export default function PublicLayout({ children }: LayoutProps<"/">) {
  // Mesure d'audience sur le site public seulement : les adresses de l'espace
  // d'administration contiennent des identifiants de profils.
  const gaId = getGaMeasurementId();

  return (
    <>
      <a
        href="#contenu"
        className="focus:bg-primary focus:text-primary-foreground sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:px-3 focus:py-2"
      >
        Aller au contenu
      </a>
      <SiteHeader />
      <div id="contenu" className="flex flex-1 flex-col">
        {children}
      </div>
      <SiteFooter />
      {gaId ? <GoogleAnalytics measurementId={gaId} /> : null}
    </>
  );
}
