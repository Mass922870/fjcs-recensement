import { describe, expect, it } from "vitest";
import { formatPhone, normalizePhone } from "@/lib/phone";

describe("normalizePhone", () => {
  it("normalise un mobile sénégalais local en E.164", () => {
    expect(normalizePhone("77 123 45 67")).toBe("+221771234567");
    expect(normalizePhone("771234567")).toBe("+221771234567");
    expect(normalizePhone("+221 78 000 11 22")).toBe("+221780001122");
  });

  it("rejette les numéros invalides", () => {
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("123")).toBeNull();
    expect(normalizePhone("abc")).toBeNull();
  });

  it("formate un E.164 en international lisible", () => {
    expect(formatPhone("+221771234567")).toBe("+221 77 123 45 67");
  });
});
