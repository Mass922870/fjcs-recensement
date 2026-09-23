"use client";

import { useEffect, useState } from "react";

interface CountUpProps {
  value: number;
  /** Durée de l'animation en millisecondes. */
  duration?: number;
  /** Nombre de décimales affichées. */
  decimals?: number;
  suffix?: string;
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Compteur animé de 0 jusqu'à `value`.
 *
 * L'état part de la valeur finale : le rendu serveur affiche donc le bon
 * chiffre, et l'animation n'est qu'un enrichissement côté navigateur. Sous
 * `prefers-reduced-motion`, la durée tombe à zéro et le compteur se fixe
 * immédiatement.
 */
export function CountUp({ value, duration = 900, decimals = 0, suffix = "" }: CountUpProps) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const total = reduced ? 0 : duration;
    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = total <= 0 ? 1 : Math.min(1, (now - start) / total);
      setDisplay(value * easeOut(progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  const formatted = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(display);

  return (
    <span suppressHydrationWarning>
      {formatted}
      {suffix}
    </span>
  );
}
