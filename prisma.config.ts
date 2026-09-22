import "dotenv/config";
import { defineConfig } from "prisma/config";
import { getDirectDatabaseUrl } from "./lib/env";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations et seed : connexion directe (non poolée) lorsqu'elle existe.
    // L'application, elle, passe par lib/db/prisma.ts et la connexion poolée.
    url: getDirectDatabaseUrl(),
  },
});
