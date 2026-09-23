/**
 * Mesure d'audience Google Analytics 4.
 *
 * La mesure est facultative : sans identifiant valide, aucun script Google
 * n'est chargé et le site fonctionne à l'identique.
 */

/** Format d'un identifiant de mesure GA4 (propriété > flux de données). */
const MEASUREMENT_ID = /^G-[A-Z0-9]{4,}$/i;

/**
 * Identifiant GA4 configuré, ou null si la mesure est désactivée.
 *
 * La variable est lue littéralement : Next.js fige les NEXT_PUBLIC_* dans le
 * bundle à la compilation, un accès dynamique renverrait undefined dans le
 * navigateur. Pour la même raison, elle ne peut pas porter de préfixe.
 */
export function getGaMeasurementId(): string | null {
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  return id && MEASUREMENT_ID.test(id) ? id : null;
}
