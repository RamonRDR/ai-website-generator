import JSZip from "jszip";
import { websiteSchema, type Website } from "./schema";
import { renderWebsite, staticCss } from "./render";

export function exportFiles(site: Website): Record<string, string> {
  const valid = websiteSchema.parse(site);
  // All output paths are constants, not user-controlled.
  const html = renderWebsite(valid).replace(
    /<style>[\s\S]*?<\/style>/,
    '<link rel="stylesheet" href="./styles.css">',
  );
  return {
    "index.html": html,
    "styles.css": staticCss(valid),
    "README.md":
      "# Exported Website\n\nOpen index.html in a browser.\n\n" +
      "Static HTML and CSS only. Demo placeholders must be replaced and links verified before publishing.\n",
    "metadata.json":
      JSON.stringify(
        {
          name: valid.name,
          description: valid.description,
          language: valid.language,
          category: valid.category,
          schemaVersion: valid.schemaVersion,
        },
        null,
        2,
      ) + "\n",
  };
}

export async function exportZip(site: Website): Promise<Blob> {
  const zip = new JSZip();
  for (const [path, content] of Object.entries(exportFiles(site))) {
    zip.file(path, content, { createFolders: false });
  }
  return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}
