/**
 * Référentiels métier : libellés des enums restants et listes de départ (seed).
 * Les référentiels configurables (quartiers, niveaux, situations, compétences,
 * besoins, intérêts, secteurs) vivent en base et se gèrent dans Paramètres.
 * Ce fichier est importable côté client (aucune dépendance serveur).
 */
import type { EmploymentKind, Gender, ProfileStatus, Role } from "@/lib/generated/prisma/enums";

export const GENDER_LABELS: Record<Gender, string> = {
  FEMALE: "Femme",
  MALE: "Homme",
};

export const PROFILE_STATUS_LABELS: Record<ProfileStatus, string> = {
  ACTIVE: "Actif",
  ARCHIVED: "Archivé",
  ANONYMIZED: "Anonymisé",
};

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super administrateur",
  ADMIN: "Administrateur",
  ANALYST: "Analyste",
  VIEWER: "Lecteur",
};

/** Sens statistique d'une situation professionnelle (pilote les KPI, indépendant des libellés). */
export const EMPLOYMENT_KIND_LABELS: Record<EmploymentKind, string> = {
  STUDENT: "Étudiant / en formation",
  EMPLOYED: "En activité (salarié, indépendant…)",
  ENTREPRENEUR: "Entrepreneur (déclenche les questions sur l'activité)",
  JOB_SEEKER: "Demandeur d'emploi",
  INACTIVE: "Sans activité",
  OTHER: "Autre",
};

export const EMPLOYMENT_KIND_ORDER: EmploymentKind[] = [
  "STUDENT",
  "EMPLOYED",
  "ENTREPRENEUR",
  "JOB_SEEKER",
  "INACTIVE",
  "OTHER",
];

/** Tranches d'âge utilisées dans les statistiques et les filtres. */
export const AGE_BRACKETS = [
  { key: "15-19", label: "15–19 ans", min: 15, max: 19 },
  { key: "20-24", label: "20–24 ans", min: 20, max: 24 },
  { key: "25-29", label: "25–29 ans", min: 25, max: 29 },
  { key: "30-35", label: "30–35 ans", min: 30, max: 35 },
  { key: "36+", label: "36 ans et +", min: 36, max: 150 },
] as const;

export type AgeBracketKey = (typeof AGE_BRACKETS)[number]["key"];

/** Slugs de référentiel utilisés par les indicateurs (renommables, non supprimables). */
export const SYSTEM_SLUGS = {
  NEED_TRAINING: "formation",
  NEED_FUNDING: "financement",
  NEED_PROJECT: "projet-entrepreneurial",
  NEED_JOB: "recherche-emploi",
  QUARTIER_OTHER: "autre",
} as const;

// ---------------------------------------------------------------------------
// Listes de départ (seed) - modifiables ensuite dans Paramètres › Référentiels
// ---------------------------------------------------------------------------

export const SEED_SKILL_CATEGORIES: { slug: string; label: string }[] = [
  { slug: "numerique", label: "Numérique" },
  { slug: "entrepreneuriat", label: "Entrepreneuriat" },
  { slug: "artisanat", label: "Artisanat & métiers techniques" },
  { slug: "culture", label: "Culture & arts" },
  { slug: "autres", label: "Autres domaines" },
];

export const SEED_SKILLS: { slug: string; label: string; category: string }[] = [
  { slug: "dev-web", label: "Développement web", category: "numerique" },
  { slug: "data", label: "Data / analyse de données", category: "numerique" },
  { slug: "ia", label: "Intelligence artificielle", category: "numerique" },
  { slug: "design", label: "Design graphique / UI", category: "numerique" },
  { slug: "reseaux", label: "Réseaux informatiques", category: "numerique" },
  { slug: "cybersecurite", label: "Cybersécurité", category: "numerique" },
  { slug: "bureautique", label: "Bureautique", category: "numerique" },
  { slug: "commerce", label: "Commerce", category: "entrepreneuriat" },
  { slug: "gestion", label: "Gestion", category: "entrepreneuriat" },
  { slug: "marketing", label: "Marketing", category: "entrepreneuriat" },
  { slug: "comptabilite", label: "Comptabilité", category: "entrepreneuriat" },
  { slug: "couture", label: "Couture", category: "artisanat" },
  { slug: "menuiserie", label: "Menuiserie", category: "artisanat" },
  { slug: "mecanique", label: "Mécanique", category: "artisanat" },
  { slug: "electricite", label: "Électricité", category: "artisanat" },
  { slug: "plomberie", label: "Plomberie", category: "artisanat" },
  { slug: "maconnerie", label: "Maçonnerie", category: "artisanat" },
  { slug: "coiffure", label: "Coiffure / esthétique", category: "artisanat" },
  { slug: "restauration", label: "Restauration / cuisine", category: "artisanat" },
  { slug: "musique", label: "Musique", category: "culture" },
  { slug: "danse", label: "Danse", category: "culture" },
  { slug: "theatre", label: "Théâtre", category: "culture" },
  { slug: "audiovisuel", label: "Audiovisuel", category: "culture" },
  { slug: "photographie", label: "Photographie", category: "culture" },
  { slug: "sport", label: "Sport", category: "autres" },
  { slug: "agriculture", label: "Agriculture / élevage", category: "autres" },
  { slug: "communication", label: "Communication", category: "autres" },
];

export const SEED_INTERESTS: { slug: string; label: string }[] = [
  { slug: "entrepreneuriat", label: "Entrepreneuriat" },
  { slug: "numerique", label: "Numérique" },
  { slug: "sport", label: "Sport" },
  { slug: "culture", label: "Culture" },
  { slug: "environnement", label: "Environnement" },
  { slug: "agriculture", label: "Agriculture" },
  { slug: "formation", label: "Formation" },
  { slug: "emploi", label: "Emploi" },
  { slug: "engagement-communautaire", label: "Engagement communautaire" },
  { slug: "leadership", label: "Leadership" },
  { slug: "innovation", label: "Innovation" },
];

export const SEED_NEEDS: { slug: string; label: string; question: string; isSystem?: boolean }[] = [
  { slug: "recherche-emploi", label: "Recherche d'emploi", question: "Êtes-vous actuellement à la recherche d'un emploi ?", isSystem: true },
  { slug: "formation", label: "Souhaite une formation", question: "Souhaitez-vous suivre une formation ?", isSystem: true },
  { slug: "accompagnement", label: "Besoin d'accompagnement", question: "Avez-vous besoin d'accompagnement ?" },
  { slug: "projet-entrepreneurial", label: "Projet entrepreneurial", question: "Avez-vous un projet entrepreneurial ?", isSystem: true },
  { slug: "financement", label: "Besoin de financement", question: "Avez-vous besoin de financement ?", isSystem: true },
  { slug: "stage", label: "Recherche de stage", question: "Recherchez-vous des opportunités de stage ?" },
  { slug: "opportunites-pro", label: "Opportunités professionnelles", question: "Recherchez-vous des opportunités professionnelles ?" },
];

export const SEED_EDUCATION_LEVELS: { slug: string; label: string }[] = [
  { slug: "aucun", label: "Aucun diplôme" },
  { slug: "primaire", label: "Primaire" },
  { slug: "college", label: "Collège (BFEM)" },
  { slug: "lycee", label: "Lycée (BAC)" },
  { slug: "bac-plus-2", label: "BAC+2 (BTS, DUT…)" },
  { slug: "licence", label: "Licence (BAC+3)" },
  { slug: "master", label: "Master (BAC+5)" },
  { slug: "doctorat", label: "Doctorat" },
  { slug: "formation-professionnelle", label: "Formation professionnelle" },
  { slug: "autre", label: "Autre" },
];

export const SEED_EMPLOYMENT_STATUSES: { slug: string; label: string; kind: EmploymentKind; requiresDetail?: boolean }[] = [
  { slug: "etudiant", label: "Étudiant(e)", kind: "STUDENT" },
  { slug: "salarie", label: "Salarié(e)", kind: "EMPLOYED" },
  { slug: "entrepreneur", label: "Entrepreneur(e)", kind: "ENTREPRENEUR" },
  { slug: "independant", label: "Indépendant(e)", kind: "EMPLOYED" },
  { slug: "demandeur-emploi", label: "Demandeur(se) d'emploi", kind: "JOB_SEEKER" },
  { slug: "apprenti", label: "Apprenti(e)", kind: "STUDENT" },
  { slug: "sans-activite", label: "Sans activité", kind: "INACTIVE" },
  { slug: "autre", label: "Autre", kind: "OTHER", requiresDetail: true },
];

export const SEED_SECTORS: { slug: string; label: string }[] = [
  { slug: "commerce-distribution", label: "Commerce / distribution" },
  { slug: "agriculture-elevage", label: "Agriculture / élevage / agroalimentaire" },
  { slug: "restauration", label: "Restauration / alimentation" },
  { slug: "mode-couture", label: "Mode / couture / textile" },
  { slug: "numerique", label: "Numérique / services informatiques" },
  { slug: "transport-logistique", label: "Transport / logistique" },
  { slug: "batiment", label: "Bâtiment / construction" },
  { slug: "beaute", label: "Beauté / bien-être" },
  { slug: "culture-evenementiel", label: "Culture / événementiel / audiovisuel" },
  { slug: "education-formation", label: "Éducation / formation" },
  { slug: "sante-social", label: "Santé / social" },
  { slug: "artisanat", label: "Artisanat" },
  { slug: "autre", label: "Autre" },
];

/**
 * Quartiers du village de Sangalkam (liste fournie par le FJCS, septembre 2026).
 * Les coordonnées se renseignent dans Paramètres › Référentiels pour la cartographie.
 */
export const SEED_QUARTIERS: { slug: string; name: string; latitude?: number; longitude?: number }[] = [
  { slug: "diamaguene", name: "Diamaguène" },
  { slug: "medina-almadies", name: "Médina et Almadies" },
  { slug: "quartier-serere", name: "Quartier Sérère" },
  { slug: "grande-mosquee", name: "Grande Mosquée" },
  { slug: "tawfekh", name: "Tawfekh" },
  { slug: "bakary-diop", name: "Bakary Diop" },
  { slug: "bayal", name: "Bayal" },
  { slug: "darou-salam-1", name: "Darou Salam 1" },
  { slug: "darou-salam-2", name: "Darou Salam 2" },
  { slug: "scale", name: "Scale" },
  { slug: "darou-rahmane", name: "Darou Rahmane" },
  { slug: "fass-sangalkam", name: "Fass Sangalkam" },
  { slug: "dianatou", name: "Dianatou" },
  { slug: "sangalkam-extension-lycee", name: "Sangalkam Extension Lycée" },
  { slug: "kam-1", name: "Kam 1" },
  { slug: "autre", name: "Autre (hors village)" },
];
