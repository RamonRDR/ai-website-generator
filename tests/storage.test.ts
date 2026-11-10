import { describe, expect, it } from "vitest";
import { addSnapshot, loadState, MAX_VERSIONS } from "../src/domain/storage";
import { generateDemo } from "../src/domain/demo";
import { validInput } from "./fixtures";

describe("local version history", () => {
  it("restores only fully valid browser data", () => {
    const site = generateDemo(validInput);
    expect(loadState(JSON.stringify({ current: site, history: [] })).current).toEqual(site);
    expect(loadState("{bad json")).toEqual({ current: null, history: [] });
    expect(loadState(JSON.stringify({ current: { html: "<script>" }, history: [] }))).toEqual({
      current: null,
      history: [],
    });
  });

  it("enforces history retention limit", () => {
    const site = generateDemo(validInput);
    let history: ReturnType<typeof addSnapshot> = [];
    for (let i = 0; i < 20; i++) {
      history = addSnapshot(history, {
        id: String(i),
        createdAt: "2026-11-08",
        description: "Version " + i,
        site,
      });
    }
    expect(history).toHaveLength(MAX_VERSIONS);
    expect(history[0].description).toBe("Version 19");
  });
});
