import { describe, expect, it } from "vitest";
import { renderSection, renderWebsite, escapeHtml } from "../src/domain/render";
import { generateDemo } from "../src/domain/demo";
import { validInput } from "./fixtures";

describe("safe renderer", () => {
  it("escapes HTML and does not render arbitrary scripts", () => {
    const site = generateDemo(validInput);
    site.sections[1].title = '<script>alert("x")</script>';
    const html = renderWebsite(site);
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("eval(");
    expect(escapeHtml("a&b")).toBe("a&amp;b");
  });

  it("omits hidden sections and marks the selected section", () => {
    const site = generateDemo(validInput);
    const first = renderSection(site.sections[1], "hero");
    expect(first).toContain("selected");
    site.sections[1].hidden = true;
    expect(renderSection(site.sections[1], "hero")).toBe("");
  });

  it("renders responsive styling, semantic headings, metadata and anchor links", () => {
    const html = renderWebsite(generateDemo(validInput));
    expect(html).toContain("@media(max-width:640px)");
    expect(html).toContain("<h1>");
    expect(html).toContain('name="description"');
    expect(html).toContain('href="#contact"');
    expect(html).toContain("<footer");
  });

  it("rejects unsafe output before rendering", () => {
    const site = generateDemo(validInput);
    site.sections[1].action = { label: "Click", href: "javascript:alert(1)" };
    expect(() => renderWebsite(site)).toThrow();
  });
});
