/**
 * Libellés de l'espace interne. Importable côté client : aucune dépendance
 * serveur, uniquement des types d'énumération.
 */
import type {
  ActionPriority,
  ActionStatus,
  AttendanceMethod,
  AttendanceStatus,
  MeetingStatus,
  MeetingType,
  MemberStatus,
  MinutesStatus,
} from "@/lib/generated/prisma/enums";

export const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  BUREAU: "Réunion du bureau",
  COMMISSION: "Réunion de commission",
  ASSEMBLEE_GENERALE: "Assemblée générale",
  EXTRAORDINAIRE: "Réunion extraordinaire",
  PROJET: "Réunion de projet",
  PARTENAIRES: "Réunion avec partenaires",
  AUTRE: "Autre",
};

export const MEETING_STATUS_LABELS: Record<MeetingStatus, string> = {
  PLANIFIEE: "Planifiée",
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
  ANNULEE: "Annulée",
  ARCHIVEE: "Archivée",
};

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: "Présent",
  ABSENT: "Absent",
  EXCUSE: "Excusé",
  RETARD: "Retard",
};

export const ATTENDANCE_METHOD_LABELS: Record<AttendanceMethod, string> = {
  MANUEL: "Manuel",
  QR_CODE: "QR code",
};

export const MINUTES_STATUS_LABELS: Record<MinutesStatus, string> = {
  BROUILLON: "Brouillon",
  EN_REVISION: "En révision",
  A_VALIDER: "À valider",
  VALIDE: "Validé",
  ARCHIVE: "Archivé",
};

export const ACTION_STATUS_LABELS: Record<ActionStatus, string> = {
  A_FAIRE: "À faire",
  EN_COURS: "En cours",
  TERMINE: "Terminé",
  BLOQUE: "Bloqué",
};

export const ACTION_PRIORITY_LABELS: Record<ActionPriority, string> = {
  BASSE: "Basse",
  NORMALE: "Normale",
  HAUTE: "Haute",
  URGENTE: "Urgente",
};

export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  ACTIF: "Actif",
  INACTIF: "Inactif",
  SUSPENDU: "Suspendu",
  ARCHIVE: "Archivé",
};

/** Classes de badge par statut de membre. */
export const MEMBER_STATUS_STYLES: Record<MemberStatus, string> = {
  ACTIF: "bg-green-50 text-green-700 border-green-200",
  INACTIF: "bg-muted text-muted-foreground border-border",
  SUSPENDU: "bg-amber-50 text-amber-800 border-amber-200",
  ARCHIVE: "bg-muted text-muted-foreground border-border",
};

/** Colonnes du Kanban, dans l'ordre d'affichage. */
export const KANBAN_COLUMNS: ActionStatus[] = ["A_FAIRE", "EN_COURS", "BLOQUE", "TERMINE"];

export const ACTION_PRIORITY_STYLES: Record<ActionPriority, string> = {
  BASSE: "bg-muted text-muted-foreground border-border",
  NORMALE: "bg-brand-50 text-brand-700 border-brand-200",
  HAUTE: "bg-amber-50 text-amber-800 border-amber-200",
  URGENTE: "bg-rose-50 text-rose-700 border-rose-200",
};

export const MEETING_STATUS_STYLES: Record<MeetingStatus, string> = {
  PLANIFIEE: "bg-brand-50 text-brand-700 border-brand-200",
  EN_COURS: "bg-cyan-50 text-cyan-800 border-cyan-200",
  TERMINEE: "bg-green-50 text-green-700 border-green-200",
  ANNULEE: "bg-rose-50 text-rose-700 border-rose-200",
  ARCHIVEE: "bg-muted text-muted-foreground border-border",
};

/** Couleur de pastille dans le calendrier, par type de séance. */
export const MEETING_TYPE_DOT: Record<MeetingType, string> = {
  BUREAU: "bg-brand-500",
  COMMISSION: "bg-cyan-500",
  ASSEMBLEE_GENERALE: "bg-green-500",
  EXTRAORDINAIRE: "bg-rose-500",
  PROJET: "bg-amber-500",
  PARTENAIRES: "bg-purple-500",
  AUTRE: "bg-slate-400",
};
