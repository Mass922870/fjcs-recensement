# Recensement de la Jeunesse de Sangalkam - FJCS

Plateforme numérique de recensement, de connaissance et d'analyse de la jeunesse de Sangalkam, portée par la **Commission Transformation Numérique et Innovation** du Foyer des Jeunes et de la Culture de Sangalkam (FJCS).

> Données → Information → Analyse → Décision → Action → Mesure de l'impact.

## Fonctionnalités

**Site public**

- Landing page (pourquoi ce recensement, données au service de l'action, FAQ)
- Formulaire de recensement en 7 étapes, mobile-first, brouillon local, validation en temps réel, champs conditionnels
- Page de confirmation avec identifiant de participation non sensible (`FJCS-XXXXXX`)
- Politique de confidentialité et page contact (contenu piloté depuis les Paramètres)

**Espace administration** (`/admin`)

- Dashboard : 7 KPI + 8 graphiques, filtres globaux dans l'URL
- Jeunes recensés : recherche, filtres, tri, pagination, fiche détaillée, édition, archivage, anonymisation, suppression (selon rôle)
- Statistiques avancées : croisements de 2 dimensions (heatmap + barres empilées), 8 analyses prédéfinies
- Cartographie : agrégats par quartier sur OpenStreetMap (jamais de position individuelle)
- Rapports PDF (logo, KPI, graphiques, conclusion descriptive générée depuis les données)
- Exports CSV / Excel, nominatifs ou anonymisés, filtrés et journalisés
- Utilisateurs (RBAC : SUPER_ADMIN, ADMIN, ANALYST, VIEWER), Paramètres, Journal d'activité
- **Référentiels 100 % configurables** (Paramètres › Référentiels) : quartiers, niveaux d'études, situations professionnelles, catégories de compétences, compétences, besoins (question incluse), centres d'intérêt, secteurs d'activité - ajout, renommage, ordre, activation, suppression sans toucher au code

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript strict · Tailwind CSS 4 · shadcn/ui · PostgreSQL 16 · Prisma 7 · Auth.js v5 · Zod 4 · React Hook Form · Recharts · Leaflet · exceljs · @react-pdf/renderer · Vitest.

## Installation

Prérequis : Node.js ≥ 20.9, npm, Docker (pour PostgreSQL local).

```bash
npm install
cp .env.example .env        # puis renseigner AUTH_SECRET (openssl rand -base64 32)
npm run db:up               # PostgreSQL 16 via Docker Compose (port 5433)
npm run db:migrate          # applique les migrations Prisma
npm run db:seed             # référentiels : quartiers, compétences, intérêts, besoins, paramètres
npm run create-admin -- --email admin@fjcs.sn --name "Prénom Nom" --role SUPER_ADMIN
npm run dev                 # http://localhost:3000
```

## Variables d'environnement

| Variable                                                 | Rôle                                                                          |
| -------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `DATABASE_URL`                                           | Connexion PostgreSQL                                                          |
| `AUTH_SECRET`                                            | Secret de signature des sessions (obligatoire)                                |
| `AUTH_TRUST_HOST`                                        | `true` derrière un proxy / hébergeur                                          |
| `NEXT_PUBLIC_APP_URL`                                    | URL publique du site                                                          |
| `IP_HASH_SALT`                                           | Sel de hachage des IP dans les journaux                                       |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | CAPTCHA Cloudflare Turnstile (optionnel, activé si les deux sont définis)     |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID`                          | Identifiant GA4 `G-XXXXXXXXXX` (optionnel, mesure du site public)             |
| `SHOW_DEMO_DATA`                                         | `true` en développement uniquement pour afficher les profils de démonstration |
| `DIRECT_URL`                                             | Connexion directe PostgreSQL, pour les migrations et le seed                  |

Ne jamais committer `.env` (déjà ignoré par git).

## Base de données

Le schéma est dans `prisma/schema.prisma` (User, YouthProfile, Education, Employment, Project, Consent, AuditLog, Setting, RateLimitBucket + référentiels : Quartier, EducationLevel, EmploymentStatus, SkillCategory, Skill, Interest, Need, Sector).

Les référentiels sont des tables : `npm run db:seed` crée les valeurs de départ **sans écraser** les modifications faites dans l'interface. Une situation professionnelle porte un « sens statistique » (`kind` : STUDENT, EMPLOYED, ENTREPRENEUR, JOB_SEEKER, INACTIVE, OTHER) qui pilote les indicateurs et les questions conditionnelles quel que soit son libellé. Les besoins marqués `isSystem` (formation, financement, projet, recherche d'emploi) alimentent les KPI : renommables, non supprimables.

```bash
npm run db:migrate            # développement : crée/applique une migration
npm run db:deploy             # production : applique les migrations existantes
npm run db:studio             # explorateur Prisma
npm run db:seed               # référentiels (idempotent)
npm run db:seed-demo          # 100 profils fictifs (isDemo=true) - développementuniquement

npm run db:studio             #Prisma Studio s'ouvrira sur http://localhost:5555.
npm run db:seed-demo -- --purge
```

#--Un client SQL (DBeaver, TablePlus, pgAdmin, extension VS Code « PostgreSQL »)
Champ Valeur
Hôte localhost
Port 5433
Base fjcs_recensement
Utilisateur fjcs
Mot de passe fjcs_dev_password
URL complète postgresql://fjcs:fjcs_dev_password@localhost:5433/fjcs_recensement

Le compte d'administration se crée localement avec `npm run create-admin` (voir plus bas) : aucun mot de passe n'est publié ici.

Les profils de démonstration sont marqués `isDemo = true`, exclus de toutes les statistiques sauf si `SHOW_DEMO_DATA=true` hors production, et le seed refuse de s'exécuter en production.

Dans VS Code, trois étapes :

1. Ouvrir le fichier `.env` à la racine du projet (Ctrl+P puis taper `.env`).

2. Remplacer la ligne :

```bash
SHOW_DEMO_DATA="false"
```

par :

```bash
SHOW_DEMO_DATA="true"
```

3. Redémarrer le serveur : dans le terminal, `Ctrl+C` puis

```bash
npm run dev
```

Les 100 profils fictifs sont toujours en base, ils réapparaissent aussitôt avec le bandeau orange et le badge « DÉMO ».

Si un jour vous les avez supprimés (`npm run db:seed-demo -- --purge`), recréez-les avec :

```bash
npm run db:seed-demo
```

## Créer le premier administrateur

```bash
npm run create-admin -- --email admin@fjcs.sn --name "Prénom Nom" --role SUPER_ADMIN
```

Le mot de passe est demandé de manière interactive (ou via `ADMIN_PASSWORD`). Les autres comptes se créent ensuite depuis `/admin/utilisateurs`.

## Développement

```bash
npm run dev          # serveur de développement
npm run lint         # ESLint
npm run typecheck    # TypeScript
npm test             # Vitest (unitaires + intégration si DATABASE_URL est défini)
npm run format       # Prettier
```

## Build et déploiement

```bash
npm run build        # prisma generate + next build
npm run start        # serveur de production
```

### Déploiement sur Vercel (Prisma Postgres)

La base est fournie par l'intégration **Prisma Postgres** du marketplace Vercel. Le projet
utilise Prisma et Auth.js : aucun client Supabase ni SDK supplémentaire n'est nécessaire.

1. **Installer l'intégration** Prisma Postgres depuis le projet Vercel. Elle crée ses variables
   de base de données avec le préfixe choisi à l'installation (ici `prod_fjcs`), par exemple
   `PROD_FJCS_DATABASE_URL`. Le projet les détecte automatiquement via [lib/env.ts](lib/env.ts) :
   aucun renommage n'est requis. Une chaîne `postgresql://` est attendue (pas `prisma+postgres://`).

2. **Ajouter les autres variables** dans Vercel (Settings > Environment Variables, Production) :

   | Variable                                                 | Valeur                    |
   | -------------------------------------------------------- | ------------------------- |
   | `AUTH_SECRET`                                            | `openssl rand -base64 32` |
   | `AUTH_TRUST_HOST`                                        | `true`                    |
   | `NEXT_PUBLIC_APP_URL`                                    | URL publique du site      |
   | `IP_HASH_SALT`                                           | `openssl rand -hex 24`    |
   | `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | optionnel (CAPTCHA)       |
   | `NEXT_PUBLIC_GA_MEASUREMENT_ID`                          | optionnel (`G-XXXXXXXXXX`) |

   Ne pas définir `SHOW_DEMO_DATA`.

3. **Déployer.** Vercel exécute le script `vercel-build` du `package.json`, qui enchaîne
   `prisma generate`, `prisma migrate deploy` puis `next build` : le schéma est donc créé et mis à
   jour à chaque déploiement. Un échec de migration fait échouer le déploiement, ce qui est voulu.

4. **Charger les référentiels** une seule fois, depuis un poste ayant les variables de production :

```bash
npm run db:seed
npm run create-admin -- --email prenom.nom@fjcs.sn --name "Prénom Nom" --role SUPER_ADMIN
```

Pour un hébergement autonome (VPS), copier `.env.production.example` en `.env.production`,
renseigner `DATABASE_URL` et `DIRECT_URL`, puis `npm run build && npm run start`.

## Sécurité et protection des données

- Validation Zod partagée client/serveur ; requêtes paramétrées via Prisma ; en-têtes de sécurité (CSP, HSTS, X-Frame-Options…) dans `next.config.ts`.
- `proxy.ts` bloque `/admin` sans session ; chaque page et action revérifie la permission (`lib/auth/rbac.ts`).
- Mots de passe bcrypt (12 rounds), verrouillage après 5 échecs, rate limiting persistant (formulaire public, connexion), honeypot, délai minimal de remplissage, Turnstile optionnel.
- Un numéro de téléphone (normalisé E.164) = une inscription ; tentatives de doublon journalisées.
- Journal d'audit sans donnée personnelle (IP hachées).
- Politique de conservation configurable ; anonymisation (irréversible) et suppression définitive (SUPER_ADMIN) depuis l'interface.
- Cadre : loi sénégalaise n° 2008-12 sur la protection des données à caractère personnel.

## Architecture

```
app/(public)      accueil, recensement, confirmation, confidentialite, contact
app/(auth)        connexion
app/(admin)/admin dashboard, jeunes, statistiques, cartographie, rapports, exports, utilisateurs, parametres, journal-audit
app/api           auth, exports, rapports
actions/          server actions (census, auth, youth, users, settings)
services/         logique métier (stats, youth, export, report, audit, settings, users, quartiers)
schemas/          schémas Zod
components/       ui (shadcn), shared, public, recensement, admin
lib/              auth, db, security, constants, pdf, helpers
prisma/           schéma, migrations, seeds
tests/            unitaires et intégration
docs/             cahier des charges, identité visuelle
```

## Évolutions prévues par l'architecture

Notifications SMS/WhatsApp, campagnes, opportunités (emplois, formations, événements), candidatures, espace jeune, QR code, statistiques publiques anonymisées, API et application mobile : les services (`services/`) sont indépendants du framework et le modèle de données (référentiels en tables, audit, RBAC granulaire) permet ces ajouts sans réécriture.
