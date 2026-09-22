/**
 * Les données de démonstration (isDemo = true) ne sont JAMAIS visibles en
 * production. En développement, elles n'apparaissent que si SHOW_DEMO_DATA=true.
 */
export function isDemoDataVisible(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.SHOW_DEMO_DATA === "true";
}
