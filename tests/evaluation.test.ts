import { describe, expect, it } from "vitest";
import { generateDemo } from "../src/domain/demo";
import { websiteSchema } from "../src/domain/schema";
import { renderWebsite } from "../src/domain/render";
import { exportFiles } from "../src/domain/export";
import { syntheticPrompts, validInput } from "./fixtures";

describe("20 deterministic regression scenarios (NOT live LLM evaluation)", () => {
  it("validates, renders and exports 20 synthetic prompts", () => {
    const outcomes = syntheticPrompts.map((prompt, index) => {
      const input = { ...validInput, prompt, name: "Fixture " + index };
      const begin = performance.now();
      try {
        const site = websiteSchema.parse(generateDemo(input));
        const html = renderWebsite(site);
        const files = exportFiles(site);
        return {
          valid: true,
          rendered: html.includes("<!doctype html>"),
          exported: files["index.html"].length > 100,
          durationMs: performance.now() - begin,
        };
      } catch {
        return { valid: false, rendered: false, exported: false, durationMs: 0 };
      }
    });
    expect(syntheticPrompts).toHaveLength(20);
    expect(outcomes.filter((outcome) => outcome.valid)).toHaveLength(20);
    expect(outcomes.filter((outcome) => outcome.rendered)).toHaveLength(20);
    expect(outcomes.filter((outcome) => outcome.exported)).toHaveLength(20);
    // Timing is measured but not subject to a flaky runner-specific threshold.
  });
});
