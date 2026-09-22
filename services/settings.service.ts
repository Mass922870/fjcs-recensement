import { prisma } from "@/lib/db";
import { DEFAULT_SETTINGS, SETTING_KEYS, type SettingKey } from "@/lib/constants/settings";

export type Settings = Record<SettingKey, string>;

/** Retourne l'ensemble des paramètres, complétés par les valeurs par défaut. */
export async function getSettings(): Promise<Settings> {
  const rows = await prisma.setting.findMany();
  const map = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    if (row.key in map) map[row.key as SettingKey] = row.value;
  }
  return map;
}

export async function getSetting(key: SettingKey): Promise<string> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value ?? DEFAULT_SETTINGS[key];
}

export async function getAgeBounds(): Promise<{ minAge: number; maxAge: number }> {
  const s = await getSettings();
  return {
    minAge: Number(s[SETTING_KEYS.MIN_AGE]) || Number(DEFAULT_SETTINGS[SETTING_KEYS.MIN_AGE]),
    maxAge: Number(s[SETTING_KEYS.MAX_AGE]) || Number(DEFAULT_SETTINGS[SETTING_KEYS.MAX_AGE]),
  };
}

export async function isFormOpen(): Promise<boolean> {
  return (await getSetting(SETTING_KEYS.FORM_OPEN)) === "true";
}

// ---------------------------------------------------------------------------
// Écriture
// ---------------------------------------------------------------------------
import type { SettingsInput } from "@/schemas/settings";
import { audit } from "./audit.service";

export async function setSetting(key: SettingKey, value: string, actorId: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    update: { value, updatedById: actorId },
    create: { key, value, updatedById: actorId },
  });
  await audit({
    action: "SETTINGS_UPDATED",
    entityType: "Setting",
    entityId: key,
    actorId,
    metadata: { keys: [key], value },
  });
}

export async function saveSettings(input: SettingsInput, actorId: string): Promise<void> {
  const entries: [SettingKey, string][] = [
    [SETTING_KEYS.MIN_AGE, String(input.minAge)],
    [SETTING_KEYS.MAX_AGE, String(input.maxAge)],
    [SETTING_KEYS.FORM_OPEN, input.formOpen ? "true" : "false"],
    [SETTING_KEYS.RETENTION_MONTHS, String(input.retentionMonths)],
    [SETTING_KEYS.CONTACT_EMAIL, input.contactEmail],
    [SETTING_KEYS.CONTACT_PHONE, input.contactPhone ?? ""],
    [SETTING_KEYS.CONTACT_ADDRESS, input.contactAddress],
  ];
  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value, updatedById: actorId },
        create: { key, value, updatedById: actorId },
      }),
    ),
  );
  await audit({
    action: "SETTINGS_UPDATED",
    entityType: "Setting",
    actorId,
    metadata: { keys: entries.map(([k]) => k) },
  });
}
