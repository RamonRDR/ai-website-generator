import { categories, type GenerateInput, type Section, type Website } from "./schema";
import { palettes } from "./themes";

const copy = {
  en: {
    home: "Home",
    about: "About",
    explore: "Explore more",
    contact: "Get in touch",
    values: "What we offer",
    story: "Our story",
    services: "Services",
    ready: "Ready to begin?",
    placeholder: "Example content. Replace with accurate information before publishing.",
    note: "Demo content only. No business claims have been verified.",
  },
  "pt-BR": {
    home: "Início",
    about: "Sobre",
    explore: "Conheça mais",
    contact: "Contato",
    values: "O que oferecemos",
    story: "Nossa história",
    services: "Serviços",
    ready: "Vamos começar?",
    placeholder: "Conteúdo de exemplo. Substitua por informações reais antes de publicar.",
    note: "Conteúdo demonstrativo. Nenhuma informação comercial foi verificada.",
  },
  es: {
    home: "Inicio",
    about: "Acerca de",
    explore: "Explorar",
    contact: "Contacto",
    values: "Lo que ofrecemos",
    story: "Nuestra historia",
    services: "Servicios",
    ready: "¿Empezamos?",
    placeholder: "Contenido de ejemplo. Reemplaza con información verificada antes de publicar.",
    note: "Contenido de demostración. No se verificaron datos comerciales.",
  },
};

const categoryNames: Record<(typeof categories)[number], string[]> = {
  business: ["Clarity", "Solutions", "Connection"],
  portfolio: ["Selected work", "Experience", "Let's collaborate"],
  institutional: ["Mission", "What we do", "Get involved"],
  product: ["What it does", "Key benefits", "Explore"],
  services: ["Our approach", "Service areas", "Contact"],
  event: ["Highlights", "Program", "Join us"],
  restaurant: ["Our concept", "Menu highlights", "Visit us"],
};

function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 30) || "project"
  );
}

function hash(value: string): string {
  let result = 0;
  for (const character of value) result = (result * 31 + character.charCodeAt(0)) >>> 0;
  return result.toString(36);
}

export function generateDemo(input: GenerateInput): Website {
  const strings = copy[input.language];
  const labels = categoryNames[input.category];
  const summary = input.prompt.trim().replace(/\s+/g, " ").slice(0, 260);
  const title = input.name.trim();
  const target = input.audience ? " " + input.audience + "." : "";
  const sections: Section[] = [
    {
      id: "header",
      type: "header",
      title,
      description: strings.home,
      items: [],
      action: { label: strings.contact, href: "#contact" },
      hidden: false,
    },
    {
      id: "hero",
      type: "hero",
      title,
      description: summary,
      action: { label: strings.explore, href: "#features" },
      items: [],
      hidden: false,
    },
    {
      id: "features",
      type: "features",
      title: strings.values,
      description: input.goal || strings.placeholder,
      items: labels.map((heading) => ({ heading, text: strings.placeholder + target })),
      hidden: false,
    },
    {
      id: "about",
      type: "about",
      title: strings.story,
      description: summary,
      items: [],
      hidden: false,
    },
    {
      id: "services",
      type: "services",
      title: strings.services,
      description: strings.placeholder,
      items: labels.slice(0, 2).map((heading) => ({ heading, text: strings.placeholder })),
      hidden: false,
    },
    {
      id: "cta",
      type: "cta",
      title: strings.ready,
      description: strings.placeholder,
      action: { label: strings.contact, href: "#contact" },
      items: [],
      hidden: false,
    },
    {
      id: "contact",
      type: "contact",
      title: strings.contact,
      description: strings.placeholder,
      items: [],
      hidden: false,
    },
    { id: "footer", type: "footer", title, description: strings.note, items: [], hidden: false },
  ];
  return {
    schemaVersion: 1,
    id: slug(title) + "-" + hash(title + summary).slice(0, 7),
    name: title,
    description: summary,
    category: input.category,
    theme: input.theme,
    language: input.language,
    palette: { ...palettes[input.theme] },
    sections,
  };
}

// Changes are scoped to one section; the caller must explicitly accept the candidate.
export function regenerateDemo(site: Website, sectionId: string, instruction: string): Website {
  const requested = instruction.trim().slice(0, 240);
  return {
    ...site,
    sections: site.sections.map((section) =>
      section.id === sectionId
        ? { ...section, description: requested, title: section.title, items: [...section.items] }
        : section,
    ),
  };
}
