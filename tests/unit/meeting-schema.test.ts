import { describe, expect, it } from "vitest";
import { combineDateTime, meetingSchema } from "@/schemas/management/meetings";

const base = {
  title: "Réunion ordinaire du bureau",
  type: "BUREAU" as const,
  date: "2026-10-05",
  startTime: "17:00",
  endTime: "19:00",
  location: "Siège du FJCS",
  description: "",
  commissionId: "",
  organizerId: "",
  agenda: [{ title: "Ouverture", description: "", duration: "10" }],
  participantIds: [],
};

describe("Saisie d'une réunion", () => {
  it("accepte une séance complète", () => {
    const parsed = meetingSchema.safeParse(base);
    expect(parsed.success).toBe(true);
  });

  it("refuse une fin antérieure au début", () => {
    const parsed = meetingSchema.safeParse({ ...base, startTime: "18:00", endTime: "17:00" });
    expect(parsed.success).toBe(false);
  });

  it("accepte une séance sans heure de fin", () => {
    const parsed = meetingSchema.safeParse({ ...base, endTime: "" });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.endTime).toBeUndefined();
  });

  it("exige une commission pour une réunion de commission", () => {
    expect(meetingSchema.safeParse({ ...base, type: "COMMISSION" }).success).toBe(false);
    expect(
      meetingSchema.safeParse({ ...base, type: "COMMISSION", commissionId: "abc" }).success,
    ).toBe(true);
  });

  it("convertit les champs facultatifs vides en undefined", () => {
    const parsed = meetingSchema.parse({ ...base, location: "", description: "" });
    expect(parsed.location).toBeUndefined();
    expect(parsed.description).toBeUndefined();
  });

  it("ne retient une durée que si elle est strictement positive", () => {
    const parsed = meetingSchema.parse({
      ...base,
      agenda: [
        { title: "Avec durée", description: "", duration: "45" },
        { title: "Durée vide", description: "", duration: "" },
        { title: "Durée nulle", description: "", duration: "0" },
        { title: "Durée absurde", description: "", duration: "abc" },
      ],
    });
    expect(parsed.agenda.map((a) => a.duration)).toEqual([45, undefined, undefined, undefined]);
  });

  it("refuse un titre trop court et un ordre du jour surdimensionné", () => {
    expect(meetingSchema.safeParse({ ...base, title: "AB" }).success).toBe(false);
    expect(
      meetingSchema.safeParse({
        ...base,
        agenda: Array.from({ length: 41 }, () => ({ title: "Point", description: "", duration: "" })),
      }).success,
    ).toBe(false);
  });

  it("combine le jour et l'heure en un instant cohérent", () => {
    const d = combineDateTime("2026-10-05", "17:30");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(9);
    expect(d.getDate()).toBe(5);
    expect(d.getHours()).toBe(17);
    expect(d.getMinutes()).toBe(30);
  });
});
