/**
 * Clés des paramètres stockés en base (table Setting) et valeurs par défaut.
 */
export const SETTING_KEYS = {
  MIN_AGE: "census.minAge",
  MAX_AGE: "census.maxAge",
  FORM_OPEN: "census.formOpen",
  RETENTION_MONTHS: "privacy.retentionMonths",
  CONTACT_EMAIL: "org.contactEmail",
  CONTACT_PHONE: "org.contactPhone",
  CONTACT_ADDRESS: "org.contactAddress",
} as const;

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];

export const DEFAULT_SETTINGS: Record<SettingKey, string> = {
  [SETTING_KEYS.MIN_AGE]: "15",
  [SETTING_KEYS.MAX_AGE]: "35",
  [SETTING_KEYS.FORM_OPEN]: "true",
  [SETTING_KEYS.RETENTION_MONTHS]: "36",
  [SETTING_KEYS.CONTACT_EMAIL]: "contact@fjcs-sangalkam.sn",
  [SETTING_KEYS.CONTACT_PHONE]: "",
  [SETTING_KEYS.CONTACT_ADDRESS]: "Sangalkam, Département de Rufisque, Sénégal",
};
