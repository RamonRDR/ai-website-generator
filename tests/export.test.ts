import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { exportFiles, exportZip } from "../src/domain/export";
import { generateDemo } from "../src/domain/demo";
import { validInput } from "./fixtures";

describe("static ZIP export", () => {
  it("exports a fixed safe set of filenames with usable content", () => {
    const files = exportFiles(generateDemo(validInput));
    expect(Object.keys(files).sort()).toEqual(
      ["README.md", "index.html", "metadata.json", "styles.css"].sort(),
    );
    expect(files["index.html"]).toContain('href="./styles.css"');
    expect(files["index.html"]).not.toContain("<script");
    expect(files["styles.css"]).toContain("@media");
    expect(JSON.parse(files["metadata.json"]).name).toBe("Sample Studio");
  });

  it("round-trips ZIP and protects paths from prompt input", async () => {
    const site = generateDemo({ ...validInput, name: "File ../ attack" });
    const blob = await exportZip(site);
    const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(blob);
    });
    const zip = await JSZip.loadAsync(buffer);
    expect(Object.keys(zip.files).sort()).toEqual(
      ["README.md", "index.html", "metadata.json", "styles.css"].sort(),
    );
    expect(await zip.file("index.html")!.async("string")).toContain("<!doctype html>");
    expect(zip.file("../secret")).toBeNull();
  });
});
