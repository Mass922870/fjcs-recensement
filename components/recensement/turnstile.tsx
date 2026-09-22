"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: { sitekey: string; callback: (token: string) => void; "error-callback"?: () => void },
      ) => string;
      remove: (id: string) => void;
    };
  }
}

interface Props {
  siteKey: string;
  onToken: (token: string | undefined) => void;
}

/** Widget Cloudflare Turnstile - rendu uniquement si une clé publique est configurée. */
export function Turnstile({ siteKey, onToken }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    const tryRender = () => {
      if (!el || !window.turnstile || widgetId.current) return;
      widgetId.current = window.turnstile.render(el, {
        sitekey: siteKey,
        callback: (token) => onToken(token),
        "error-callback": () => onToken(undefined),
      });
    };
    tryRender();
    const interval = window.setInterval(tryRender, 300);
    return () => {
      window.clearInterval(interval);
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [siteKey, onToken]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="lazyOnload"
      />
      <div ref={ref} className="min-h-[65px]" />
    </>
  );
}
