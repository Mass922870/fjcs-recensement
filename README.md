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

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Connexion PostgreSQL |
| `AUTH_SECRET` | Secret de signature des sessions (obligatoire) |
| `AUTH_TRUST_HOST` | `true` derrière un proxy / hébergeur |
| `NEXT_PUBLIC_APP_URL` | URL publique du site |
| `IP_HASH_SALT` | Sel de hachage des IP dans les journaux |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | CAPTCHA Cloudflare Turnstile (optionnel, activé si les deux sont définis) |
| `SHOW_DEMO_DATA` | `true` en développement uniquement pour afficher les profils de démonstration |

Ne jamais committer `.env` (déjà ignoré par git).

## Base de données

Le schéma est dans `prisma/schema.prisma` (User, YouthProfile, Education, Employment, Project, Consent, AuditLog, Setting, RateLimitBucket + référentiels : Quartier, EducationLevel, EmploymentStatus, SkillCategory, Skill, Interest, Need, Sector).

Les référentiels sont des tables : `npm run db:seed` crée les valeurs de départ **sans écraser** les modifications faites dans l'interface. Une situation professionnelle porte un « sens statistique » (`kind` : STUDENT, EMPLOYED, ENTREPRENEUR, JOB_SEEKER, INACTIVE, OTHER) qui pilote les indicateurs et les questions conditionnelles quel que soit son libellé. Les besoins marqués `isSystem` (formation, financement, projet, recherche d'emploi) alimentent les KPI : renommables, non supprimables.

```bash
npm run db:migrate            # développement : crée/applique une migration
npm run db:deploy             # production : applique les migrations existantes
npm run db:studio             # explorateur Prisma
npm run db:seed               # référentiels (idempotent)
npm run db:seed-demo          # 100 profils fictifs (isDemo=true) - développement uniquement
npm run db:seed-demo -- --purge
```

Les profils de démonstration sont marqués `isDemo = true`, exclus de toutes les statistiques sauf si `SHOW_DEMO_DATA=true` hors production, et le seed refuse de s'exécuter en production.

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

Déploiement type (Vercel + PostgreSQL managé, ou VPS/Docker) :
1. Provisionner PostgreSQL et définir `DATABASE_URL`, `AUTH_SECRET`, `AUTH_TRUST_HOST=true`, `NEXT_PUBLIC_APP_URL`, `IP_HASH_SALT`.
2. `npm run db:deploy` puis `npm run db:seed`.
3. `npm run build` puis `npm run start` (ou déploiement Vercel).
4. Créer le premier SUPER_ADMIN avec `create-admin`.
5. Optionnel : activer Turnstile en renseignant les deux clés.

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
