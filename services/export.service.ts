import ExcelJS from "exceljs";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { computeAge } from "@/lib/age";
import { formatPhone } from "@/lib/phone";
import { GENDER_LABELS } from "@/lib/constants/referentials";
import type { StatsFilters } from "@/schemas/filters";
import { buildProfileWhere } from "./stats.service";

export type ExportScope = "personal" | "anonymous";
export type ExportFormat = "csv" | "xlsx";

export interface ExportColumn {
  key: string;
  header: string;
  width?: number;
}

export interface ExportDataset {
  columns: ExportColumn[];
  rows: Record<string, string | number | null>[];
  generatedAt: Date;
  scope: ExportScope;
}

const ANONYMOUS_COLUMNS: ExportColumn[] = [
  { key: "code", header: "Identifiant", width: 14 },
  { key: "age", header: "Âge", width: 6 },
  { key: "gender", header: "Sexe", width: 8 },
  { key: "quartier", header: "Quartier", width: 22 },
  { key: "educationLevel", header: "Niveau d'études", width: 24 },
  { key: "field", header: "Domaine d'études", width: 22 },
  { key: "employment", header: "Situation", width: 22 },
  { key: "projectSector", header: "Secteur d'activité", width: 26 },
  { key: "projectFormalized", header: "Activité formalisée", width: 12 },
  { key: "skills", header: "Compétences", width: 40 },
  { key: "needs", header: "Besoins", width: 40 },
  { key: "interests", header: "Centres d'intérêt", width: 40 },
  { key: "createdAt", header: "Date d'inscription", width: 14 },
];

const PERSONAL_COLUMNS: ExportColumn[] = [
  { key: "code", header: "Identifiant", width: 14 },
  { key: "lastName", header: "Nom", width: 18 },
  { key: "firstName", header: "Prénom", width: 18 },
  { key: "birthDate", header: "Date de naissance", width: 14 },
  { key: "phone", header: "Téléphone", width: 18 },
  { key: "email", header: "E-mail", width: 28 },
  ...ANONYMOUS_COLUMNS.filter((c) => c.key !== "code"),
];

/**
 * Construit le jeu de données d'export. Le périmètre `personal` inclut les
 * coordonnées ; `anonymous` ne contient aucune donnée identifiante.
 */
export async function buildExportDataset(
  filters: StatsFilters,
  scope: ExportScope,
): Promise<ExportDataset> {
  const where = buildProfileWhere(filters);
  const profiles = await prisma.youthProfile.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      quartier: { select: { name: true } },
      education: { include: { level: { select: { label: true } } } },
      employment: { include: { status: { select: { label: true } } } },
      project: true,
      skills: { include: { skill: { select: { label: true } } } },
      needs: { include: { need: { select: { label: true } } } },
      interests: { include: { interest: { select: { label: true } } } },
    },
  });

  const rows = profiles.map((p) => {
    const base: Record<string, string | number | null> = {
      code: p.participationCode,
      age: computeAge(p.birthDate),
      gender: GENDER_LABELS[p.gender],
      quartier: p.quartier?.name ?? p.quartierOther ?? "",
      educationLevel: p.education?.level.label ?? "",
      field: p.education?.field ?? "",
      employment: p.employment?.status.label ?? "",
      projectSector: p.project?.sector ?? "",
      projectFormalized: p.project ? (p.project.isFormalized ? "Oui" : "Non") : "",
      skills: [
        ...p.skills.map((s) => s.skill.label),
        ...(p.customSkills ? [p.customSkills] : []),
      ].join(", "),
      needs: p.needs.map((n) => n.need.label).join(", "),
      interests: [
        ...p.interests.map((i) => i.interest.label),
        ...(p.customInterests ? [p.customInterests] : []),
      ].join(", "),
      createdAt: format(p.createdAt, "yyyy-MM-dd"),
    };
    if (scope === "personal") {
      return {
        ...base,
        lastName: p.lastName,
        firstName: p.firstName,
        birthDate: format(p.birthDate, "yyyy-MM-dd"),
        phone: p.phoneNormalized ? formatPhone(p.phoneNormalized) : p.phone,
        email: p.email ?? "",
      };
    }
    return base;
  });

  return {
    columns: scope === "personal" ? PERSONAL_COLUMNS : ANONYMOUS_COLUMNS,
    rows,
    generatedAt: new Date(),
    scope,
  };
}

/** CSV UTF-8 avec BOM et séparateur « ; » (ouverture directe dans Excel francophone). */
export function datasetToCsv(ds: ExportDataset): string {
  const escape = (v: string | number | null) => {
    const s = v == null ? "" : String(v);
    return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [ds.columns.map((c) => escape(c.header)).join(";")];
  for (const row of ds.rows)
    lines.push(ds.columns.map((c) => escape(row[c.key] ?? null)).join(";"));
  return `﻿${lines.join("\r\n")}`;
}

export async function datasetToXlsx(ds: ExportDataset): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "FJCS - Recensement de la jeunesse";
  wb.created = ds.generatedAt;
  const ws = wb.addWorksheet("Jeunes recensés", { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = ds.columns.map((c) => ({ header: c.header, key: c.key, width: c.width ?? 16 }));
  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A0D90" } };
  for (const row of ds.rows) ws.addRow(row);
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ds.columns.length } };

  const meta = wb.addWorksheet("Informations");
  meta.columns = [{ width: 28 }, { width: 60 }];
  meta.addRows([
    ["Source", "Plateforme de recensement de la jeunesse - FJCS"],
    ["Généré le", format(ds.generatedAt, "dd/MM/yyyy HH:mm")],
    [
      "Périmètre",
      ds.scope === "personal"
        ? "Données nominatives - usage interne strictement réservé"
        : "Données anonymisées",
    ],
    ["Nombre de lignes", ds.rows.length],
  ]);

  const out = await wb.xlsx.writeBuffer();
  return Buffer.from(out as ArrayBuffer);
}
