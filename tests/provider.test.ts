import { afterEach, describe, expect, it, vi } from "vitest";
import { generateLive, regenerateLive } from "../src/server/provider";
import { generateDemo } from "../src/domain/demo";
import { validInput } from "./fixtures";

describe("paid provider guardrails", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does not make any paid call when live mode is disabled", async () => {
    vi.stubEnv("LLM_ENABLED", "false");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    await expect(generateLive(validInput)).rejects.toThrow("disabled");
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("also guards live regeneration when disabled", async () => {
    vi.stubEnv("LLM_ENABLED", "false");
    await expect(
      regenerateLive({
        site: generateDemo(validInput),
        instruction: "Make the about text more concise",
        sectionId: "about",
        mode: "live",
      }),
    ).rejects.toThrow("disabled");
  });
});
