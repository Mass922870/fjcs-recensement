/** Dimensions disponibles pour les statistiques croisées (importable côté client). */
export const CROSS_DIMENSIONS = {
  gender: "Sexe",
  age: "Tranche d'âge",
  quartier: "Quartier",
  education: "Niveau d'études",
  employment: "Situation professionnelle",
  need: "Besoin exprimé",
  skillCategory: "Domaine de compétence",
  interest: "Centre d'intérêt",
  project: "Activité entrepreneuriale",
} as const;

export type CrossDimension = keyof typeof CROSS_DIMENSIONS;

/** Dimensions où un même jeune peut compter dans plusieurs catégories. */
export const MULTI_VALUED_DIMENSIONS: CrossDimension[] = ["need", "skillCategory", "interest"];
