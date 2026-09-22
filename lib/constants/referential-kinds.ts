/** Référentiels administrables (importable côté client). */
export const REFERENTIAL_KINDS = {
  quartier: { label: "Quartiers", singular: "quartier", hint: "Zones proposées à l'étape 1 et utilisées par la cartographie." },
  educationLevel: { label: "Niveaux d'études", singular: "niveau d'études", hint: "Liste de l'étape 2, dans l'ordre affiché." },
  employmentStatus: { label: "Situations professionnelles", singular: "situation", hint: "Choix de l'étape 3. Le « sens statistique » pilote les indicateurs et les questions conditionnelles." },
  skillCategory: { label: "Catégories de compétences", singular: "catégorie", hint: "Regroupent les compétences à l'étape 4." },
  skill: { label: "Compétences", singular: "compétence", hint: "Cases à cocher de l'étape 4, rattachées à une catégorie." },
  need: { label: "Besoins", singular: "besoin", hint: "Questions de l'étape 5. Les besoins « système » alimentent les indicateurs : renommables, non supprimables." },
  interest: { label: "Centres d'intérêt", singular: "centre d'intérêt", hint: "Cases à cocher de l'étape 6." },
  sector: { label: "Secteurs d'activité", singular: "secteur", hint: "Domaines proposés aux entrepreneurs à l'étape 3." },
} as const;

export type ReferentialKind = keyof typeof REFERENTIAL_KINDS;
export const REFERENTIAL_KIND_LIST = Object.keys(REFERENTIAL_KINDS) as ReferentialKind[];
