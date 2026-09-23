import { describe, expect, it } from "vitest";
import { documentUploadSchema, titleFromFileName } from "@/schemas/management/documents";

/** Reproduit ce que `FormData.get()` renvoie : une chaîne, ou null si absent. */
function formValues(fields: Record<string, string | undefined>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) fd.set(key, value);
  }
  return { title: fd.get("title"), meetingId: fd.get("meetingId") };
}

describe("Dépôt d'un document", () => {
  it("accepte un dépôt depuis la page Documents, sans champ réunion", () => {
    // Régression : formData.get("meetingId") vaut null quand le champ n'existe
    // pas, ce qui faisait échouer tout dépôt hors d'une réunion.
    const parsed = documentUploadSchema.safeParse(formValues({ title: "Convocation" }));
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.meetingId).toBeUndefined();
  });

  it("accepte un dépôt depuis l'onglet d'une réunion", () => {
    const parsed = documentUploadSchema.safeParse(
      formValues({ title: "Convocation", meetingId: "cm123" }),
    );
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.meetingId).toBe("cm123");
  });

  it("accepte un titre laissé vide, que le serveur déduira du fichier", () => {
    const parsed = documentUploadSchema.safeParse(formValues({ title: "" }));
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.title).toBeUndefined();
  });

  it("traite un champ réunion vide comme absent", () => {
    const parsed = documentUploadSchema.parse(formValues({ title: "T", meetingId: "" }));
    expect(parsed.meetingId).toBeUndefined();
  });

  it("refuse un titre démesuré", () => {
    expect(
      documentUploadSchema.safeParse(formValues({ title: "x".repeat(161) })).success,
    ).toBe(false);
  });

  it("déduit le titre du nom de fichier", () => {
    expect(titleFromFileName("Convocation du bureau.pdf")).toBe("Convocation du bureau");
    expect(titleFromFileName("rapport.final.docx")).toBe("rapport.final");
    // Un nom réduit à son extension reste utilisable tel quel.
    expect(titleFromFileName(".pdf")).toBe(".pdf");
    expect(titleFromFileName("a.pdf")).toBe("a");
  });
});
