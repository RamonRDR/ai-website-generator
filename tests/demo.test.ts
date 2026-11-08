import { describe, expect, it } from "vitest";
import { generateDemo, regenerateDemo } from "../src/domain/demo";
import {
  categories,
  themes,
  languages,
  websiteSchema,
} from "../src/domain/schema";
import { validInput } from "./fixtures";

describe("deterministic demo", () => {
  it("generates a valid website for every category, theme and language", () => {
    for (const category of categories) {
      for (const theme of themes) {
        for (const language of languages) {
          const site = generateDemo({ ...validInput, category, theme, language });
          expect(websiteSchema.safeParse(site).success).toBe(true);
          expect(site.sections.some((section) => section.type === "hero")).toBe(true);
        }
      }
    }
  });

  it("is repeatable and does not pretend placeholders are verified facts", () => {
    expect(generateDemo(validInput)).toEqual(generateDemo(validInput));
    const site = generateDemo(validInput);
    expect(JSON.stringify(site)).toContain("Demo content only");
    expect(JSON.stringify(site)).not.toContain("555-0100");
  });

  it("changes only the requested section", () => {
    const site = generateDemo(validInput);
    const changed = regenerateDemo(site, "about", "Make it shorter.");
    expect(changed.sections.find((s) => s.id === "about")?.description).toBe("Make it shorter.");
    expect(changed.sections.filter((s) => s.id !== "about")).toEqual(
      site.sections.filter((s) => s.id !== "about"),
    );
    expect(site.sections.find((s) => s.id === "about")?.description).not.toBe("Make it shorter.");
  });
});
