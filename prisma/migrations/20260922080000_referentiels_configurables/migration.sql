-- Référentiels configurables : les enums EducationLevel, EmploymentStatus et SkillCategory
-- deviennent des tables administrables. Migration conservatrice : les données existantes
-- sont reliées aux nouvelles lignes avant suppression des anciennes colonnes.

-- 1. Colonnes texte + valeurs mappées, puis suppression des anciennes colonnes enum
-- Skill : enum category → FK
ALTER TABLE "Skill" ADD COLUMN "categoryId" TEXT;
UPDATE "Skill" SET "categoryId" = CASE "category"::text
  WHEN 'DIGITAL' THEN 'skc_numerique'
  WHEN 'ENTREPRENEURSHIP' THEN 'skc_entrepreneuriat'
  WHEN 'CRAFT' THEN 'skc_artisanat'
  WHEN 'CULTURE' THEN 'skc_culture'
  ELSE 'skc_autres' END;
ALTER TABLE "Skill" ALTER COLUMN "categoryId" SET NOT NULL;
DROP INDEX "Skill_category_idx";
ALTER TABLE "Skill" DROP COLUMN "category";

-- Education : enum level → FK
ALTER TABLE "Education" ADD COLUMN "levelId" TEXT;
UPDATE "Education" SET "levelId" = CASE "level"::text
  WHEN 'NONE' THEN 'edu_aucun'
  WHEN 'PRIMARY' THEN 'edu_primaire'
  WHEN 'MIDDLE' THEN 'edu_college'
  WHEN 'SECONDARY' THEN 'edu_lycee'
  WHEN 'BAC_PLUS_2' THEN 'edu_bac_plus_2'
  WHEN 'LICENCE' THEN 'edu_licence'
  WHEN 'MASTER' THEN 'edu_master'
  WHEN 'DOCTORATE' THEN 'edu_doctorat'
  WHEN 'VOCATIONAL' THEN 'edu_formation_pro'
  ELSE 'edu_autre' END;
ALTER TABLE "Education" ALTER COLUMN "levelId" SET NOT NULL;
DROP INDEX "Education_level_idx";
ALTER TABLE "Education" DROP COLUMN "level";

-- Employment : enum status → FK
ALTER TABLE "Employment" ADD COLUMN "statusId" TEXT;
UPDATE "Employment" SET "statusId" = CASE "status"::text
  WHEN 'STUDENT' THEN 'emp_etudiant'
  WHEN 'EMPLOYEE' THEN 'emp_salarie'
  WHEN 'ENTREPRENEUR' THEN 'emp_entrepreneur'
  WHEN 'FREELANCER' THEN 'emp_independant'
  WHEN 'JOB_SEEKER' THEN 'emp_demandeur'
  WHEN 'APPRENTICE' THEN 'emp_apprenti'
  WHEN 'INACTIVE' THEN 'emp_sans_activite'
  ELSE 'emp_autre' END;
ALTER TABLE "Employment" ALTER COLUMN "statusId" SET NOT NULL;
DROP INDEX "Employment_status_idx";
ALTER TABLE "Employment" DROP COLUMN "status";


-- 2. Suppression des enums (leurs noms sont réutilisés par les nouvelles tables)
DROP TYPE "EducationLevel";
DROP TYPE "EmploymentStatus";
DROP TYPE "SkillCategory";

-- 3. Nouvelles tables de référentiels
-- CreateEnum
CREATE TYPE "EmploymentKind" AS ENUM ('STUDENT', 'EMPLOYED', 'ENTREPRENEUR', 'JOB_SEEKER', 'INACTIVE', 'OTHER');

-- CreateTable
CREATE TABLE "SkillCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "SkillCategory_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "EducationLevel" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "EducationLevel_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "EmploymentStatus" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "kind" "EmploymentKind" NOT NULL DEFAULT 'OTHER',
    "requiresDetail" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "EmploymentStatus_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Sector" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Sector_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SkillCategory_slug_key" ON "SkillCategory"("slug");
CREATE UNIQUE INDEX "EducationLevel_slug_key" ON "EducationLevel"("slug");
CREATE UNIQUE INDEX "EmploymentStatus_slug_key" ON "EmploymentStatus"("slug");
CREATE UNIQUE INDEX "Sector_slug_key" ON "Sector"("slug");

-- Lignes de base (mêmes valeurs que les anciens enums)
INSERT INTO "SkillCategory" ("id", "slug", "label", "sortOrder") VALUES
  ('skc_numerique', 'numerique', 'Numérique', 0),
  ('skc_entrepreneuriat', 'entrepreneuriat', 'Entrepreneuriat', 1),
  ('skc_artisanat', 'artisanat', 'Artisanat & métiers techniques', 2),
  ('skc_culture', 'culture', 'Culture & arts', 3),
  ('skc_autres', 'autres', 'Autres domaines', 4);

INSERT INTO "EducationLevel" ("id", "slug", "label", "sortOrder") VALUES
  ('edu_aucun', 'aucun', 'Aucun diplôme', 0),
  ('edu_primaire', 'primaire', 'Primaire', 1),
  ('edu_college', 'college', 'Collège (BFEM)', 2),
  ('edu_lycee', 'lycee', 'Lycée (BAC)', 3),
  ('edu_bac_plus_2', 'bac-plus-2', 'BAC+2 (BTS, DUT…)', 4),
  ('edu_licence', 'licence', 'Licence (BAC+3)', 5),
  ('edu_master', 'master', 'Master (BAC+5)', 6),
  ('edu_doctorat', 'doctorat', 'Doctorat', 7),
  ('edu_formation_pro', 'formation-professionnelle', 'Formation professionnelle', 8),
  ('edu_autre', 'autre', 'Autre', 9);

INSERT INTO "EmploymentStatus" ("id", "slug", "label", "kind", "requiresDetail", "sortOrder") VALUES
  ('emp_etudiant', 'etudiant', 'Étudiant(e)', 'STUDENT', false, 0),
  ('emp_salarie', 'salarie', 'Salarié(e)', 'EMPLOYED', false, 1),
  ('emp_entrepreneur', 'entrepreneur', 'Entrepreneur(e)', 'ENTREPRENEUR', false, 2),
  ('emp_independant', 'independant', 'Indépendant(e)', 'EMPLOYED', false, 3),
  ('emp_demandeur', 'demandeur-emploi', 'Demandeur(se) d''emploi', 'JOB_SEEKER', false, 4),
  ('emp_apprenti', 'apprenti', 'Apprenti(e)', 'STUDENT', false, 5),
  ('emp_sans_activite', 'sans-activite', 'Sans activité', 'INACTIVE', false, 6),
  ('emp_autre', 'autre', 'Autre', 'OTHER', true, 7);

INSERT INTO "Sector" ("id", "slug", "label", "sortOrder") VALUES
  ('sec_commerce', 'commerce-distribution', 'Commerce / distribution', 0),
  ('sec_agri', 'agriculture-elevage', 'Agriculture / élevage / agroalimentaire', 1),
  ('sec_resto', 'restauration', 'Restauration / alimentation', 2),
  ('sec_mode', 'mode-couture', 'Mode / couture / textile', 3),
  ('sec_num', 'numerique', 'Numérique / services informatiques', 4),
  ('sec_transport', 'transport-logistique', 'Transport / logistique', 5),
  ('sec_batiment', 'batiment', 'Bâtiment / construction', 6),
  ('sec_beaute', 'beaute', 'Beauté / bien-être', 7),
  ('sec_culture', 'culture-evenementiel', 'Culture / événementiel / audiovisuel', 8),
  ('sec_education', 'education-formation', 'Éducation / formation', 9),
  ('sec_sante', 'sante-social', 'Santé / social', 10),
  ('sec_artisanat', 'artisanat', 'Artisanat', 11),
  ('sec_autre', 'autre', 'Autre', 12);

-- 4. Clés étrangères et index
CREATE INDEX "Skill_categoryId_idx" ON "Skill"("categoryId");
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "SkillCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "Education_levelId_idx" ON "Education"("levelId");
ALTER TABLE "Education" ADD CONSTRAINT "Education_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "EducationLevel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "Employment_statusId_idx" ON "Employment"("statusId");
ALTER TABLE "Employment" ADD CONSTRAINT "Employment_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "EmploymentStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Need : question configurable + besoins système
ALTER TABLE "Need" ADD COLUMN "isSystem" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "question" TEXT NOT NULL DEFAULT '';
UPDATE "Need" SET "question" = CASE "slug"
  WHEN 'recherche-emploi' THEN 'Êtes-vous actuellement à la recherche d''un emploi ?'
  WHEN 'formation' THEN 'Souhaitez-vous suivre une formation ?'
  WHEN 'accompagnement' THEN 'Avez-vous besoin d''accompagnement ?'
  WHEN 'projet-entrepreneurial' THEN 'Avez-vous un projet entrepreneurial ?'
  WHEN 'financement' THEN 'Avez-vous besoin de financement ?'
  WHEN 'stage' THEN 'Recherchez-vous des opportunités de stage ?'
  WHEN 'opportunites-pro' THEN 'Recherchez-vous des opportunités professionnelles ?'
  ELSE "label" END;
UPDATE "Need" SET "isSystem" = true WHERE "slug" IN ('formation', 'financement', 'projet-entrepreneurial', 'recherche-emploi');
ALTER TABLE "Need" ALTER COLUMN "question" DROP DEFAULT;

