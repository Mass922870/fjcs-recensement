import { describe, expect, it } from "vitest";
import { datasetToCsv, datasetToXlsx, type ExportDataset } from "@/services/export.service";

const ds: ExportDataset = {
  scope: "anonymous",
  generatedAt: new Date("2026-09-21T10:00:00Z"),
  columns: [
    { key: "code", header: "Identifiant" },
    { key: "skills", header: "Compétences" },
  ],
  rows: [
    { code: "FJCS-AAAAAA", skills: 'Data; "IA"' },
    { code: "FJCS-BBBBBB", skills: null },
  ],
};

describe("exports", () => {
  it("génère un CSV avec BOM, séparateur ; et échappement", () => {
    const csv = datasetToCsv(ds);
    expect(csv.startsWith("﻿")).toBe(true);
    const lines = csv.slice(1).split("\r\n");
    expect(lines[0]).toBe("Identifiant;Compétences");
    expect(lines[1]).toBe('FJCS-AAAAAA;"Data; ""IA"""');
    expect(lines[2]).toBe("FJCS-BBBBBB;");
  });

  it("génère un classeur Excel valide", async () => {
    const buf = await datasetToXlsx(ds);
    expect(buf.length).toBeGreaterThan(1000);
    // Signature ZIP (xlsx = zip)
    expect(buf.subarray(0, 2).toString()).toBe("PK");
  });
});
