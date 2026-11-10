import { afterEach, describe, expect, it, vi } from "vitest";
import { generateLive, regenerateLive } from "../src/server/provider";
import { generateDemo } from "../src/domain/demo";
import { validInput } from "./fixtures";

describe("paid provider guardrails", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("does not make any paid call when live mode is disabled", async () => {
    vi.stubEnv("LLM_ENABLED", "false");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    await expect(generateLive(validInput)).rejects.toThrow("disabled");
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("regenerates only one section without requesting the whole website", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("LLM_ENABLED", "true");
    vi.stubEnv("LLM_API_KEY", "fake-test-key");
    vi.stubEnv("LLM_MODEL", "test-json-schema-model");
    const original = generateDemo(validInput);
    original.sections[2].description = "UNCHANGED_SECTION_SENTINEL";
    const requested = original.sections[1];
    const replacement = { ...requested, title: "Improved hero" };
    const fetchMock = vi.fn(async (_url: string, _options?: RequestInit) => ({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(replacement) } }],
      }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await regenerateLive({
      site: original,
      sectionId: requested.id,
      instruction: "Improve the heading",
      mode: "live",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.openai.com/v1/chat/completions");
    const payload = JSON.parse(options?.body as string);
    expect(payload.response_format.json_schema.name).toBe("replacement_section");
    expect(payload.response_format.json_schema.schema.properties).not.toHaveProperty("sections");
    const requestContext = JSON.parse(payload.messages[1].content);
    expect(requestContext).toHaveProperty("section");
    expect(requestContext.website).not.toHaveProperty("sections");
    expect(payload.messages[1].content).not.toContain("UNCHANGED_SECTION_SENTINEL");
    expect(payload.max_completion_tokens).toBe(12000);
    expect(result.sections[1].title).toBe("Improved hero");
    expect(result.sections[2]).toEqual(original.sections[2]);
    expect(result.palette).toEqual(original.palette);
    expect(result.sections).toHaveLength(original.sections.length);
  });

  it("rejects a replacement section with the wrong id or type", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("LLM_ENABLED", "true");
    vi.stubEnv("LLM_API_KEY", "fake-test-key");
    vi.stubEnv("LLM_MODEL", "test-json-schema-model");
    const site = generateDemo(validInput);
    const wrong = { ...site.sections[1], id: "different-section" };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(wrong) } }],
        }),
      })),
    );
    await expect(
      regenerateLive({
        site,
        sectionId: "hero",
        instruction: "Make the heading concise",
        mode: "live",
      }),
    ).rejects.toThrow("does not match");
    expect(site.sections[1].id).toBe("hero");
  });

  it("rejects untrusted invalid section output before merging it into the site", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("LLM_ENABLED", "true");
    vi.stubEnv("LLM_API_KEY", "fake-test-key");
    vi.stubEnv("LLM_MODEL", "test-json-schema-model");
    const site = generateDemo(validInput);
    const invalid = {
      ...site.sections[1],
      action: { label: "Click", href: "javascript:alert(1)" },
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(invalid) } }],
        }),
      })),
    );
    await expect(
      regenerateLive({
        site,
        sectionId: "hero",
        instruction: "Improve the call to action",
        mode: "live",
      }),
    ).rejects.toThrow("schema failed validation");
    expect(site.sections[1].action?.href).toBe("#features");
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
