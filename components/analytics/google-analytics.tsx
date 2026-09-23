"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Adresse envoyée à Google, débarrassée de sa chaîne de requête.
 *
 * Indispensable : /confirmation?code=FJCS-XXXXXX contient l'identifiant de
 * participation, qui est une donnée personnelle. Aucun paramètre d'URL n'est
 * utile à la mesure d'audience, ils sont donc tous retirés.
 */
function sanitized(pathname: string) {
  return {
    page_path: pathname,
    page_location: `${window.location.origin}${pathname}`,
    page_title: document.title,
  };
}

/**
 * Charge le tag GA4 sur les pages publiques uniquement.
 *
 * La vue de page automatique est désactivée (send_page_view) au profit d'un
 * envoi manuel : c'est le seul moyen de maîtriser l'adresse transmise, y
 * compris lors des navigations internes qui ne rechargent pas la page.
 */
export function GoogleAnalytics({ measurementId }: { measurementId: string }) {
  const pathname = usePathname();
  // La vue initiale est envoyée par le script d'initialisation ci-dessous, qui
  // garantit qu'elle suit la commande `config`. On mémorise donc la page déjà
  // comptée : l'effet ne déclenche rien tant que le chemin ne change pas, y
  // compris lorsque React le rejoue (mode strict).
  const lastCountedPath = useRef(pathname);

  useEffect(() => {
    if (lastCountedPath.current === pathname) return;
    lastCountedPath.current = pathname;
    window.gtag?.("event", "page_view", sanitized(pathname));
  }, [pathname]);

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){window.dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', '${measurementId}', {
  send_page_view: false,
  allow_google_signals: false,
  allow_ad_personalization_signals: false
});
gtag('event', 'page_view', {
  page_path: location.pathname,
  page_location: location.origin + location.pathname,
  page_title: document.title
});`}
      </Script>
    </>
  );
}
