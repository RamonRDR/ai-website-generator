import { z } from "zod";

export const categories = [
  "business",
  "portfolio",
  "institutional",
  "product",
  "services",
  "event",
  "restaurant",
] as const;
export const themes = ["ocean", "sunset", "forest", "mono"] as const;
export const languages = ["en", "pt-BR", "es"] as const;
export const sectionTypes = [
  "header",
  "hero",
  "features",
  "about",
  "services",
  "pricing",
  "testimonials",
  "faq",
  "cta",
  "contact",
  "footer",
] as const;

export type SectionType = (typeof sectionTypes)[number];
export type Theme = (typeof themes)[number];

export function safeHref(value: string): boolean {
  if (value.length > 500 || /[\u0000-\u001F\u007F]/.test(value)) return false;
  if (value.startsWith("#")) return /^#[a-zA-Z0-9_-]+$/.test(value);
  if (value.startsWith("/")) return /^\/(?!\/)[a-zA-Z0-9_/#?=&%.-]*$/.test(value);
  try {
    const url = new URL(value);
    return ["https:", "http:", "mailto:", "tel:"].includes(url.protocol) &&
      !url.username && !url.password;
  } catch {
    return false;
  }
}

export const hrefSchema = z.string().max(500).refine(safeHref, "Unsafe link");
const text = z.string().trim().min(1).max(240);
const longText = z.string().trim().max(1500);
const id = z.string().regex(/^[a-z0-9][a-z0-9-]{2,39}$/);
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const paletteSchema = z.object({
  background: color,
  surface: color,
  text: color,
  primary: color,
  accent: color,
}).strict();

export const itemSchema = z.object({
  heading: text,
  text: longText,
  href: hrefSchema.optional(),
}).strict();

export const actionSchema = z.object({
  label: text,
  href: hrefSchema,
}).strict();

export const imageSchema = z.object({
  url: z.string().url().max(500).refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" &&
        ["images.unsplash.com", "placehold.co"].includes(url.hostname);
    } catch {
      return false;
    }
  }, "Image must use an approved HTTPS host"),
  alt: text,
}).strict();

// A closed catalog. No arbitrary HTML, script, CSS, dynamic component name, or JSX.
export const sectionSchema = z.object({
  id,
  type: z.enum(sectionTypes),
  title: text,
  description: longText.default(""),
  items: z.array(itemSchema).max(8).default([]),
  action: actionSchema.optional(),
  image: imageSchema.optional(),
  hidden: z.boolean().default(false),
}).strict();

export const websiteSchema = z.object({
  schemaVersion: z.literal(1),
  id,
  name: text,
  description: longText,
  language: z.enum(languages),
  category: z.enum(categories),
  theme: z.enum(themes),
  palette: paletteSchema,
  sections: z.array(sectionSchema).min(2).max(18),
}).strict().superRefine((site, context) => {
  const ids = site.sections.map((section) => section.id);
  if (new Set(ids).size !== ids.length) {
    context.addIssue({ code: "custom", message: "Section identifiers must be unique", path: ["sections"] });
  }
  if (JSON.stringify(site).length > 90000) {
    context.addIssue({ code: "custom", message: "Website exceeds size limit" });
  }
});

export const generateInputSchema = z.object({
  prompt: z.string().trim().min(10).max(1500),
  name: z.string().trim().min(2).max(100),
  audience: z.string().trim().max(160).default(""),
  goal: z.string().trim().max(160).default(""),
  category: z.enum(categories),
  theme: z.enum(themes),
  language: z.enum(languages),
  mode: z.enum(["demo", "live"]).default("demo"),
}).strict();

export const regenerationInputSchema = z.object({
  site: websiteSchema,
  instruction: z.string().trim().min(5).max(500),
  sectionId: id,
  mode: z.enum(["demo", "live"]).default("demo"),
}).strict().refine(
  (input) => input.site.sections.some((section) => section.id === input.sectionId),
  "Selected section does not exist",
);

export type Website = z.infer<typeof websiteSchema>;
export type Section = Website["sections"][number];
export type GenerateInput = z.infer<typeof generateInputSchema>;
export type RegenerateInput = z.infer<typeof regenerationInputSchema>;
