import { websiteSchema, type Section, type Website } from "./schema";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function actionMarkup(action: Section["action"]): string {
  if (!action) return "";
  return (
    '<a class="button" href="' +
    escapeHtml(action.href) +
    '" rel="noopener noreferrer">' +
    escapeHtml(action.label) +
    "</a>"
  );
}

export function renderSection(section: Section, selectedId?: string): string {
  if (section.hidden) return "";
  const title = escapeHtml(section.title);
  const description = escapeHtml(section.description);
  const heading = section.type === "hero" ? "h1" : "h2";
  const head = "<" + heading + ">" + title + "</" + heading + ">";
  const text = description ? "<p>" + description + "</p>" : "";
  const items = section.items.length
    ? '<div class="cards">' +
      section.items
        .map(
          (item) =>
            '<article class="item"><h3>' +
            escapeHtml(item.heading) +
            "</h3><p>" +
            escapeHtml(item.text) +
            "</p>" +
            (item.href
              ? '<a href="' + escapeHtml(item.href) + '" rel="noopener noreferrer">Learn more</a>'
              : "") +
            "</article>",
        )
        .join("") +
      "</div>"
    : "";
  const img = section.image
    ? '<img loading="lazy" alt="' +
      escapeHtml(section.image.alt) +
      '" src="' +
      escapeHtml(section.image.url) +
      '">'
    : "";
  const tag =
    section.type === "header" ? "header" : section.type === "footer" ? "footer" : "section";
  const className =
    "section section-" + section.type + (selectedId === section.id ? " selected" : "");
  return (
    "<" +
    tag +
    ' id="' +
    escapeHtml(section.id) +
    '" class="' +
    className +
    '" data-section="' +
    escapeHtml(section.id) +
    '">' +
    '<div class="section-inner">' +
    head +
    text +
    img +
    items +
    actionMarkup(section.action) +
    "</div></" +
    tag +
    ">"
  );
}

export function staticCss(site: Website): string {
  const p = site.palette;
  return [
    ":root{color-scheme:light;--bg:" +
      p.background +
      ";--surface:" +
      p.surface +
      ";--text:" +
      p.text +
      ";--primary:" +
      p.primary +
      ";--accent:" +
      p.accent +
      ";}",
    "*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;line-height:1.6}",
    "a{color:var(--primary)}a:focus-visible{outline:3px solid var(--primary);outline-offset:4px}",
    ".section{padding:68px 24px}.section-inner{max-width:1060px;margin:0 auto}.section h1,.section h2,.section h3{letter-spacing:-.035em;line-height:1.12}",
    ".section h1{font-size:clamp(2.8rem,7vw,5rem);max-width:800px;margin:0 0 24px}.section h2{font-size:clamp(2rem,5vw,3.3rem);margin:0 0 22px}",
    ".section p{font-size:1.05rem;max-width:760px;margin:0 0 24px;overflow-wrap:anywhere}",
    ".section-header{background:var(--surface);padding:20px 24px;border-bottom:1px solid var(--accent)}.section-header .section-inner{display:flex;align-items:center;justify-content:space-between;gap:24px}",
    ".section-header h2{font-size:1.4rem;margin:0}.section-header p{display:none}",
    ".section-hero{padding:100px 24px;background:linear-gradient(145deg,var(--bg),var(--accent))}.section-hero p{font-size:1.25rem}",
    ".section-features,.section-services,.section-pricing,.section-faq,.section-testimonials{background:var(--surface)}",
    ".section-cta{text-align:center;background:var(--accent)}.section-cta p{margin-left:auto;margin-right:auto}",
    ".section-footer{padding:40px 24px;background:var(--text);color:var(--surface)}.section-footer h2{font-size:1.3rem}.section-footer p{font-size:.9rem}",
    ".cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr));gap:20px;margin-top:28px}",
    ".item{border:1px solid var(--accent);border-radius:16px;padding:26px;background:var(--bg);min-width:0}.item h3{margin:0 0 16px;font-size:1.3rem}",
    ".button{display:inline-flex;align-items:center;justify-content:center;min-height:45px;border-radius:12px;background:var(--primary);color:white;padding:12px 23px;text-decoration:none;font-weight:700}",
    ".section img{max-width:100%;height:auto;border-radius:18px;margin:20px 0;display:block}",
    ".selected{outline:4px dashed var(--primary);outline-offset:-4px}",
    "@media(max-width:640px){.section{padding:48px 20px}.section-hero{padding:76px 20px}.section-header .section-inner{flex-wrap:wrap}.cards{grid-template-columns:1fr}}",
  ].join("\n");
}

export function renderWebsite(site: Website, selectedId?: string): string {
  const safeSite = websiteSchema.parse(site);
  const lang = safeSite.language === "pt-BR" ? "pt-BR" : safeSite.language;
  return (
    '<!doctype html><html lang="' +
    lang +
    '"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="description" content="' +
    escapeHtml(safeSite.description.slice(0, 160)) +
    '">' +
    "<title>" +
    escapeHtml(safeSite.name) +
    "</title><style>" +
    staticCss(safeSite) +
    "</style></head><body>" +
    safeSite.sections.map((section) => renderSection(section, selectedId)).join("\n") +
    "</body></html>"
  );
}
