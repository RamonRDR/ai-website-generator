# Exporting a Website

1. Generate or restore a valid website.
2. Edit components and preview both desktop and mobile.
3. Click **Export ZIP**. Your browser downloads `website-export.zip`.
4. Extract the archive.
5. Open `index.html` in a browser or publish the static files on a compatible host.

The archive contains exactly:

- `index.html`: semantic page markup and SEO title/description.
- `styles.css`: responsive styles and the active validated palette.
- `metadata.json`: basic project metadata and schema version.
- `README.md`: offline usage and publishing reminder.

The renderer is shared between preview and export. During export, its inline stylesheet is moved to `styles.css`. This is static content only; no JavaScript runtime, API, authentication or Next.js server is included.

## Precautions

Replace illustrative text and placeholders, verify all contact details, URLs and rights to any remote images, and evaluate mobile layout, accessibility and factual claims. The ZIP generator uses predetermined paths, so project names and prompts cannot create unexpected files or `../` traversal.
