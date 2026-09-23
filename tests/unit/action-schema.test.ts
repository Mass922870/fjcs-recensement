import { describe, expect, it } from "vitest";
import { actionFiltersSchema, actionItemSchema } from "@/schemas/management/actions";

const base = {
  title: "Préparer le budget prévisionnel",
  description: "",
  assigneeId: "",
  commissionId: "",
  dueDate: "",
  priority: "NORMALE" as const,
  status: "A_FAIRE" as const,
  meetingId: "",
  decisionId: "",
};

describe("Saisie d'une action", () => {
  it("accepte une action minimale", () => {
    expect(actionItemSchema.safeParse(base).success).toBe(true);
  });

  it("refuse un intitulé trop court", () => {
    expect(actionItemSchema.safeParse({ ...base, title: "ab" }).success).toBe(false);
  });

  it("convertit les identifiants vides en undefined plutôt qu'en chaîne", () => {
    const parsed = actionItemSchema.parse(base);
    expect(parsed.assigneeId).toBeUndefined();
    expect(parsed.commissionId).toBeUndefined();
    expect(parsed.dueDate).toBeUndefined();
  });

  it("interprète l'échéance à midi, pour ne pas basculer de jour selon le fuseau", () => {
    const parsed = actionItemSchema.parse({ ...base, dueDate: "2026-10-05" });
    expect(parsed.dueDate?.getDate()).toBe(5);
    expect(parsed.dueDate?.getHours()).toBe(12);
  });

  it("refuse une date d'échéance mal formée", () => {
    expect(actionItemSchema.safeParse({ ...base, dueDate: "05/10/2026" }).success).toBe(false);
  });

  it("retombe sur la vue Kanban si la vue demandée est inconnue", () => {
    expect(actionFiltersSchema.parse({ view: "galerie" }).view).toBe("kanban");
    expect(actionFiltersSchema.parse({ view: "tableau" }).view).toBe("tableau");
  });

  it("ignore un filtre d'échéance non prévu", () => {
    expect(actionFiltersSchema.safeParse({ due: "siecle" }).success).toBe(false);
    expect(actionFiltersSchema.parse({ due: "retard" }).due).toBe("retard");
  });
});
