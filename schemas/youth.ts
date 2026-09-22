import { z } from "zod";
import { Gender } from "@/lib/generated/prisma/enums";
import { normalizePhone } from "@/lib/phone";
import { computeAge } from "@/lib/age";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `${max} caractères maximum.`)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined));

/** Entier facultatif saisi dans un <input type="number"> : "" → undefined. */
const optionalInt = (min: number, max: number, minMessage = "Valeur invalide.") =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z
      .number({ error: "Valeur invalide." })
      .int("Valeur invalide.")
      .min(min, minMessage)
      .max(max, "Valeur invalide.")
      .optional(),
  );

const nameSchema = z
  .string()
  .trim()
  .min(2, "Au moins 2 caractères.")
  .max(60, "60 caractères maximum.")
  .regex(/^[\p{L}\p{M}' \-]+$/u, "Caractères non autorisés.");

export interface AgeBounds {
  minAge: number;
  maxAge: number;
}

/** Règles dérivées des référentiels (situations qui déclenchent l'activité / une précision). */
export interface CensusRules {
  entrepreneurStatusSlugs: string[];
  detailStatusSlugs: string[];
}

export const EMPTY_RULES: CensusRules = { entrepreneurStatusSlugs: [], detailStatusSlugs: [] };

// ---------------------------------------------------------------------------
// Étape 1 - Informations personnelles
// ---------------------------------------------------------------------------
export function createPersonalSchema(bounds: AgeBounds) {
  return z
    .object({
      firstName: nameSchema,
      lastName: nameSchema,
      birthDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide.")
        .refine((v) => !Number.isNaN(new Date(v).getTime()), "Date invalide.")
        .refine((v) => {
          const age = computeAge(new Date(v));
          return age >= bounds.minAge && age <= bounds.maxAge;
        }, `Le recensement concerne les jeunes de ${bounds.minAge} à ${bounds.maxAge} ans.`),
      gender: z.enum(Gender, { error: "Veuillez indiquer votre sexe." }),
      phone: z
        .string()
        .trim()
        .min(1, "Le numéro de téléphone est requis.")
        .refine(
          (v) => normalizePhone(v) !== null,
          "Numéro de téléphone invalide (ex. 77 123 45 67).",
        ),
      email: z
        .string()
        .trim()
        .toLowerCase()
        .optional()
        .or(z.literal(""))
        .refine((v) => !v || z.email().safeParse(v).success, "Adresse e-mail invalide.")
        .transform((v) => (v ? v : undefined)),
      quartierSlug: z.string().min(1, "Veuillez choisir votre quartier."),
      quartierOther: optionalText(80),
    })
    .refine((d) => d.quartierSlug !== "autre" || !!d.quartierOther, {
      message: "Précisez votre quartier ou zone de résidence.",
      path: ["quartierOther"],
    });
}

// ---------------------------------------------------------------------------
// Étape 2 - Formation
// ---------------------------------------------------------------------------
export const educationSchema = z.object({
  levelSlug: z.string().min(1, "Veuillez indiquer votre niveau d'études."),
  field: optionalText(100),
  institution: optionalText(120),
  diploma: optionalText(120),
  vocationalTraining: optionalText(200),
  otherTraining: optionalText(300),
});

// ---------------------------------------------------------------------------
// Étape 3 - Situation professionnelle (+ activité si entrepreneur)
// ---------------------------------------------------------------------------
export const projectSchema = z.object({
  sector: z.string().trim().min(1, "Indiquez votre domaine d'activité.").max(100),
  name: optionalText(120),
  isFormalized: z.boolean(),
  sinceMonths: optionalInt(0, 600),
  teamSize: optionalInt(1, 10000, "Au moins 1 personne (vous)."),
});

export function createEmploymentSchema(rules: CensusRules) {
  return z
    .object({
      statusSlug: z.string().min(1, "Veuillez indiquer votre situation."),
      otherDetail: optionalText(120),
      project: projectSchema.optional(),
    })
    .superRefine((d, ctx) => {
      if (rules.entrepreneurStatusSlugs.includes(d.statusSlug) && !d.project?.sector) {
        ctx.addIssue({
          code: "custom",
          path: ["project", "sector"],
          message: "Indiquez votre domaine d'activité.",
        });
      }
      if (rules.detailStatusSlugs.includes(d.statusSlug) && !d.otherDetail) {
        ctx.addIssue({ code: "custom", path: ["otherDetail"], message: "Précisez votre situation." });
      }
    });
}

// ---------------------------------------------------------------------------
// Étape 4 - Compétences
// ---------------------------------------------------------------------------
export const skillsSchema = z
  .object({
    skillSlugs: z.array(z.string()).max(30),
    customSkills: optionalText(200),
  })
  .refine((d) => d.skillSlugs.length > 0 || !!d.customSkills, {
    message: "Sélectionnez au moins une compétence ou précisez-en une.",
    path: ["skillSlugs"],
  });

// ---------------------------------------------------------------------------
// Étape 5 - Besoins
// ---------------------------------------------------------------------------
export const needsSchema = z.object({
  needSlugs: z.array(z.string()).max(20),
});

// ---------------------------------------------------------------------------
// Étape 6 - Centres d'intérêt
// ---------------------------------------------------------------------------
export const interestsSchema = z.object({
  interestSlugs: z.array(z.string()).max(20),
  customInterests: optionalText(200),
});

// ---------------------------------------------------------------------------
// Étape 7 - Consentement
// ---------------------------------------------------------------------------
export const consentSchema = z.object({
  consent: z.literal(true, {
    error: "Vous devez accepter la politique de confidentialité pour valider.",
  }),
});

// ---------------------------------------------------------------------------
// Schéma complet (formulaire public)
// ---------------------------------------------------------------------------
export function createCensusSchema(bounds: AgeBounds, rules: CensusRules = EMPTY_RULES) {
  return z.object({
    personal: createPersonalSchema(bounds),
    education: educationSchema,
    employment: createEmploymentSchema(rules),
    skills: skillsSchema,
    needs: needsSchema,
    interests: interestsSchema,
    consent: consentSchema,
  });
}

export type CensusSchema = ReturnType<typeof createCensusSchema>;
/** Valeurs telles que saisies dans le formulaire (avant transformation). */
export type CensusFormInput = z.input<CensusSchema>;
/** Valeurs validées et transformées (côté serveur). */
export type CensusFormOutput = z.output<CensusSchema>;

/** Métadonnées anti-abus envoyées avec le formulaire (jamais affichées). */
export const censusMetaSchema = z.object({
  /** Honeypot : doit rester vide. */
  website: z.string().max(0).optional().or(z.literal("")),
  /** Horodatage d'ouverture du formulaire (ms epoch). */
  startedAt: z.number().int().positive(),
  turnstileToken: z.string().optional(),
});
export type CensusMeta = z.infer<typeof censusMetaSchema>;

export const CENSUS_STEP_KEYS = [
  "personal",
  "education",
  "employment",
  "skills",
  "needs",
  "interests",
  "consent",
] as const;
export type CensusStepKey = (typeof CENSUS_STEP_KEYS)[number];

export const CENSUS_STEPS: { key: CensusStepKey; title: string; short: string }[] = [
  { key: "personal", title: "Informations personnelles", short: "Identité" },
  { key: "education", title: "Formation", short: "Formation" },
  { key: "employment", title: "Situation professionnelle", short: "Situation" },
  { key: "skills", title: "Compétences", short: "Compétences" },
  { key: "needs", title: "Situation et besoins", short: "Besoins" },
  { key: "interests", title: "Centres d'intérêt", short: "Intérêts" },
  { key: "consent", title: "Validation", short: "Validation" },
];

export const CENSUS_DEFAULT_VALUES: CensusFormInput = {
  personal: {
    firstName: "",
    lastName: "",
    birthDate: "",
    gender: undefined as unknown as Gender,
    phone: "",
    email: "",
    quartierSlug: "",
    quartierOther: "",
  },
  education: {
    levelSlug: "",
    field: "",
    institution: "",
    diploma: "",
    vocationalTraining: "",
    otherTraining: "",
  },
  employment: {
    statusSlug: "",
    otherDetail: "",
    project: undefined,
  },
  skills: { skillSlugs: [], customSkills: "" },
  needs: { needSlugs: [] },
  interests: { interestSlugs: [], customInterests: "" },
  consent: { consent: undefined as unknown as true },
};
