/**
 * Résolution des variables d'environnement de base de données.
 *
 * L'intégration Prisma Postgres de Vercel crée les variables avec un préfixe
 * choisi à l'installation (ici « prod_fjcs »), par exemple
 * PROD_FJCS_DATABASE_URL. Ce module retrouve la bonne variable quel que soit
 * son préfixe, afin que le code applicatif n'ait jamais à le connaître.
 */

/** Noms reconnus, par ordre de préférence pour l'application. */
const RUNTIME_KEYS = ["DATABASE_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL", "PRISMA_DATABASE_URL"];

/** Noms reconnus, par ordre de préférence pour les migrations (connexion non poolée). */
const DIRECT_KEYS = [
  "DIRECT_URL",
  "DIRECT_DATABASE_URL",
  "POSTGRES_URL_NON_POOLING",
  "DATABASE_URL_UNPOOLED",
  ...RUNTIME_KEYS,
];

const POSTGRES_SCHEME = /^postgres(ql)?:\/\//i;

/** Toutes les variables dont le nom se termine par `suffix`, préfixe éventuel compris. */
function matching(suffix: string): { key: string; value: string }[] {
  const re = new RegExp(`(^|_)${suffix}$`, "i");
  return (
    Object.entries(process.env)
      .filter(([key, value]) => re.test(key) && typeof value === "string" && value.length > 0)
      .map(([key, value]) => ({ key, value: value as string }))
      // Une variable nommée exactement comme le suffixe l'emporte sur une variante préfixée.
      .sort(
        (a, b) => Number(b.key.toUpperCase() === suffix) - Number(a.key.toUpperCase() === suffix),
      )
  );
}

function resolve(keys: string[]): { key: string; value: string } | null {
  for (const suffix of keys) {
    const found = matching(suffix).find((c) => POSTGRES_SCHEME.test(c.value));
    if (found) return found;
  }
  return null;
}

function fail(what: string): never {
  const seen = Object.keys(process.env)
    .filter((k) => /(DATABASE|POSTGRES|PRISMA)/i.test(k))
    .sort();
  const accelerate = Object.entries(process.env).some(
    ([, v]) => typeof v === "string" && v.startsWith("prisma+postgres://"),
  );
  throw new Error(
    [
      `${what} introuvable : aucune variable d'environnement ne contient une chaîne « postgresql:// ».`,
      seen.length
        ? `Variables détectées : ${seen.join(", ")}.`
        : "Aucune variable de base détectée.",
      accelerate
        ? "Une URL « prisma+postgres:// » (Prisma Accelerate) est présente : utilisez la chaîne de connexion TCP directe du projet Prisma Postgres, que ce projet attend."
        : "Voir .env.production.example.",
    ].join(" "),
  );
}

/** Chaîne de connexion utilisée par l'application. */
export function getDatabaseUrl(): string {
  return (resolve(RUNTIME_KEYS) ?? fail("DATABASE_URL")).value;
}

/** Chaîne de connexion utilisée par les migrations et le seed (connexion directe si disponible). */
export function getDirectDatabaseUrl(): string {
  return (resolve(DIRECT_KEYS) ?? fail("DIRECT_URL / DATABASE_URL")).value;
}

/** Nom de la variable réellement retenue - utile pour les diagnostics au démarrage. */
export function getDatabaseUrlSource(): string {
  return resolve(RUNTIME_KEYS)?.key ?? "(aucune)";
}
