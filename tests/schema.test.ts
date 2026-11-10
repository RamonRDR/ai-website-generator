import { describe, expect, it } from "vitest";
import { generateDemo } from "../src/domain/demo";
import { safeHref, sectionSchema, websiteSchema, generateInputSchema } from "../src/domain/schema";
import { validInput } from "./fixtures";

describe("schema allowlists and validation", () => {
  it("accepts safe links", () => {
    expect(safeHref("#contact")).toBe(true);
    expect(safeHref("/services?show=1")).toBe(true);
    expect(safeHref("https://example.com")).toBe(true);
    expect(safeHref("mailto:hello@example.org")).toBe(true);
  });

  it.each([
    "javascript:alert(1)",
    "data:text/html,evil",
    "//evil.com",
    "http://user:pass@host.test",
    "\nhttps://ok.test",
  ])("blocks unsafe link: %s", (value) => expect(safeHref(value)).toBe(false));

  it("rejects unknown components and arbitrary code", () => {
    expect(
      sectionSchema.safeParse({ ...generateDemo(validInput).sections[0], type: "script" }).success,
    ).toBe(false);
    expect(
      sectionSchema.safeParse({
        ...generateDemo(validInput).sections[0],
        html: "<script>alert(1)</script>",
      }).success,
    ).toBe(false);
  });

  it("rejects repeated section ids and unsafe images", () => {
    const site = generateDemo(validInput);
    site.sections[1].id = site.sections[0].id;
    expect(websiteSchema.safeParse(site).success).toBe(false);
    const other = generateDemo(validInput);
    other.sections[1].image = { url: "https://example.com/track.png", alt: "Image" };
    expect(websiteSchema.safeParse(other).success).toBe(false);
  });

  it("rejects oversized prompts and unexpected parameters", () => {
    expect(generateInputSchema.safeParse({ ...validInput, prompt: "x".repeat(2000) }).success).toBe(
      false,
    );
    expect(generateInputSchema.safeParse({ ...validInput, executeCode: true }).success).toBe(false);
  });
});
