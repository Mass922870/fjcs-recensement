import type { AuditAction } from "@/lib/generated/prisma/enums";

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  PROFILE_CREATED: "Profil créé",
  PROFILE_UPDATED: "Profil modifié",
  PROFILE_ARCHIVED: "Profil archivé",
  PROFILE_RESTORED: "Profil restauré",
  PROFILE_ANONYMIZED: "Profil anonymisé",
  PROFILE_DELETED: "Profil supprimé",
  DUPLICATE_ATTEMPT: "Tentative de doublon",
  LOGIN_SUCCESS: "Connexion réussie",
  LOGIN_FAILED: "Échec de connexion",
  LOGOUT: "Déconnexion",
  USER_CREATED: "Utilisateur créé",
  USER_UPDATED: "Utilisateur modifié",
  USER_DEACTIVATED: "Utilisateur désactivé",
  USER_PASSWORD_CHANGED: "Mot de passe modifié",
  EXPORT_GENERATED: "Export généré",
  REPORT_GENERATED: "Rapport généré",
  SETTINGS_UPDATED: "Paramètres modifiés",
  REFERENTIAL_UPDATED: "Référentiel modifié",
};
