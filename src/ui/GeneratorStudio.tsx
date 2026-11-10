"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  categories,
  languages,
  sectionTypes,
  themes,
  websiteSchema,
  type GenerateInput,
  type Section,
  type SectionType,
  type Theme,
  type Website,
} from "../domain/schema";
import { palettes } from "../domain/themes";
import { renderWebsite } from "../domain/render";
import { exportZip } from "../domain/export";
import {
  STORAGE_KEY,
  addSnapshot,
  loadState,
  makeSnapshot,
  type Snapshot,
} from "../domain/storage";

const initialForm: GenerateInput = {
  prompt: "A professional and welcoming website for a creative digital studio.",
  name: "Northstar Studio",
  category: "business",
  theme: "ocean",
  language: "en",
  audience: "",
  goal: "",
  mode: "demo",
};
const themeLabels: Record<Theme, string> = {
  ocean: "Ocean / Blue",
  sunset: "Sunset / Warm",
  forest: "Forest / Green",
  mono: "Mono / Neutral",
};
const displayName = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

function Field({
  id,
  label,
  value,
  onChange,
  multiline = false,
  placeholder,
  onBlur,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
  onBlur?: () => void;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          rows={4}
        />
      ) : (
        <input
          id={id}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

// Keep incomplete or whitespace-sensitive edits local until the field is blurred.
// The website state, preview, history and export only receive schema-validated data.
function EditableField({
  id,
  label,
  value,
  onCommit,
  multiline,
}: {
  id: string;
  label: string;
  value: string;
  onCommit: (value: string) => void;
  multiline?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  return (
    <Field
      id={id}
      label={label}
      value={draft}
      onChange={setDraft}
      onBlur={() => onCommit(draft)}
      multiline={multiline}
    />
  );
}

type Proposal = { site: Website; sectionId: string; baseRevision: number };

export function GeneratorStudio() {
  const [form, setForm] = useState<GenerateInput>(initialForm);
  const [site, setSite] = useState<Website | null>(null);
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [selectedId, setSelectedId] = useState("hero");
  const [newSectionType, setNewSectionType] = useState<SectionType>("features");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [instruction, setInstruction] = useState("");
  const [candidate, setCandidate] = useState<Proposal | null>(null);
  const siteRevision = useRef(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Defer reading browser-only storage until after the initial hydration paint.
    const handle = window.setTimeout(() => {
      const saved = loadState(window.localStorage.getItem(STORAGE_KEY));
      siteRevision.current += 1;
      setSite(saved.current);
      setHistory(saved.history);
      if (saved.current)
        setSelectedId(saved.current.sections[1]?.id ?? saved.current.sections[0].id);
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(handle);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ current: site, history }));
    } catch {
      // Storage can be disabled, private, or full. Never crash the editor.
    }
  }, [site, history, hydrated]);

  const selected = site?.sections.find((section) => section.id === selectedId);
  const showing =
    candidate && site
      ? {
          ...site,
          sections: site.sections.map(
            (section) =>
              candidate.site.sections.find(
                (proposed) => proposed.id === candidate.sectionId && section.id === proposed.id,
              ) ?? section,
          ),
        }
      : site;
  const html = showing ? renderWebsite(showing, selectedId) : "";

  const updateForm = <K extends keyof GenerateInput>(key: K, value: GenerateInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const applySite = (next: Website) => {
    const parsed = websiteSchema.safeParse(next);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Website validation failed.");
      return false;
    }
    siteRevision.current += 1;
    setSite(parsed.data);
    if (candidate) {
      setCandidate(null);
      setNotice("Previous regeneration proposal cleared after an edit.");
    }
    setError("");
    return true;
  };

  const updateSection = (patch: Partial<Section>) => {
    if (!site || !selected) return;
    applySite({
      ...site,
      sections: site.sections.map((section) =>
        section.id === selected.id ? { ...section, ...patch } : section,
      ),
    });
  };

  async function post<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error || "The request failed.");
    return json as T;
  }

  const onGenerate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setCandidate(null);
    try {
      const response = await post<{ site: Website; mode: string }>("/api/generate", form);
      const parsed = websiteSchema.parse(response.site);
      siteRevision.current += 1;
      setSite(parsed);
      setSelectedId("hero");
      setHistory((current) => addSnapshot(current, makeSnapshot(parsed, "Generated website")));
      setNotice(
        response.mode === "demo"
          ? "Deterministic demo created. Content is illustrative, not live AI output."
          : "Live structured website generated.",
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Generation failed.");
    } finally {
      setBusy(false);
    }
  };

  const saveVersion = () => {
    if (!site) return;
    setHistory((current) => addSnapshot(current, makeSnapshot(site, "Manual checkpoint")));
    setNotice("Version saved to this browser.");
  };

  const restoreVersion = (snapshot: Snapshot) => {
    if (applySite(structuredClone(snapshot.site))) {
      setSelectedId(snapshot.site.sections[1]?.id ?? snapshot.site.sections[0].id);
      setCandidate(null);
      setNotice("Version restored. Save a checkpoint to keep this revision in history.");
    }
  };

  const moveSection = (direction: -1 | 1) => {
    if (!site || !selected) return;
    const sections = [...site.sections];
    const index = sections.findIndex((section) => section.id === selected.id);
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    [sections[index], sections[target]] = [sections[target], sections[index]];
    applySite({ ...site, sections });
  };

  const removeSection = () => {
    if (!site || !selected || site.sections.length <= 2) return;
    const sections = site.sections.filter((section) => section.id !== selected.id);
    if (applySite({ ...site, sections })) setSelectedId(sections[0].id);
  };

  const addSection = () => {
    if (!site || site.sections.length >= 18) {
      setError("The maximum number of sections is 18.");
      return;
    }
    const newSection: Section = {
      id: "section-" + crypto.randomUUID().slice(0, 8),
      type: newSectionType,
      title: displayName(newSectionType),
      description: "Placeholder content. Replace before publishing.",
      items: [],
      hidden: false,
    };
    const sections = [...site.sections];
    const footerIndex = sections.findIndex((section) => section.type === "footer");
    sections.splice(footerIndex < 0 ? sections.length : footerIndex, 0, newSection);
    if (applySite({ ...site, sections })) setSelectedId(newSection.id);
  };

  const onRegenerate = async () => {
    if (!site || !selected) return;
    const baseRevision = siteRevision.current;
    const sectionId = selected.id;
    const originalType = selected.type;
    setBusy(true);
    setError("");
    try {
      const response = await post<{ site: Website; mode: string }>("/api/regenerate", {
        site,
        instruction,
        sectionId,
        mode: form.mode,
      });
      const valid = websiteSchema.parse(response.site);
      if (siteRevision.current !== baseRevision) {
        setNotice("The website changed during regeneration. Request a fresh proposal.");
        return;
      }
      const proposedSection = valid.sections.find((section) => section.id === sectionId);
      if (!proposedSection || proposedSection.type !== originalType) {
        throw new Error("The proposal does not contain the selected section.");
      }
      setCandidate({ site: valid, sectionId, baseRevision });
      setNotice(
        response.mode === "demo"
          ? "Demo change proposed. Review the preview, then accept or reject."
          : "Live AI change proposed. Review before accepting.",
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Regeneration failed.");
    } finally {
      setBusy(false);
    }
  };

  const acceptCandidate = () => {
    if (!candidate || !site) return;
    if (siteRevision.current !== candidate.baseRevision) {
      setCandidate(null);
      setNotice("The website changed. Request a fresh regeneration proposal.");
      return;
    }
    const proposedSection = candidate.site.sections.find(
      (section) => section.id === candidate.sectionId,
    );
    const currentSection = site.sections.find((section) => section.id === candidate.sectionId);
    if (!proposedSection || !currentSection || proposedSection.type !== currentSection.type) {
      setCandidate(null);
      setError("The target section changed. Request a fresh proposal.");
      return;
    }
    // Never replace the full site with an older response snapshot.
    const updated: Website = {
      ...site,
      sections: site.sections.map((section) =>
        section.id === candidate.sectionId ? proposedSection : section,
      ),
    };
    if (applySite(updated)) {
      setHistory((current) =>
        addSnapshot(current, makeSnapshot(updated, "Accepted regeneration")),
      );
      setInstruction("");
      setNotice("Regeneration accepted and versioned.");
    }
  };

  const onExport = async () => {
    if (!site) return;
    try {
      const blob = await exportZip(site);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "website-export.zip";
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice("ZIP exported with HTML, CSS, metadata and README.");
    } catch {
      setError("Unable to export this website.");
    }
  };

  return (
    <main className="app">
      <header className="topbar">
        <div className="brand">
          <span className="mark" aria-hidden="true">
            W
          </span>
          <span>Website Studio</span>
        </div>
        <div className="top-meta">
          <span className="pill">Structured AI Generator</span>
          <span>Safe renderer · Local versions</span>
        </div>
      </header>

      <div className="workspace">
        <section className="panel" aria-labelledby="create-heading">
          <span className="eyebrow">01 / Create</span>
          <h2 id="create-heading">Describe your website</h2>
          <p className="lead">
            Start from a prompt and shape your site with a safe component catalog.
          </p>
          <form onSubmit={onGenerate}>
            <Field
              id="site-name"
              label="Project / business name"
              value={form.name}
              onChange={(value) => updateForm("name", value)}
            />
            <Field
              id="prompt"
              label="Describe what you want"
              value={form.prompt}
              onChange={(value) => updateForm("prompt", value)}
              multiline
              placeholder="Describe the site, audience and visual direction..."
            />
            <div className="field">
              <label htmlFor="category">Website category</label>
              <select
                id="category"
                value={form.category}
                onChange={(event) =>
                  updateForm("category", event.target.value as GenerateInput["category"])
                }
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {displayName(category)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="theme">Initial theme</label>
              <select
                id="theme"
                value={form.theme}
                onChange={(event) =>
                  updateForm("theme", event.target.value as GenerateInput["theme"])
                }
              >
                {themes.map((theme) => (
                  <option key={theme} value={theme}>
                    {themeLabels[theme]}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="language">Content language</label>
              <select
                id="language"
                value={form.language}
                onChange={(event) =>
                  updateForm("language", event.target.value as GenerateInput["language"])
                }
              >
                {languages.map((language) => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </select>
            </div>
            <Field
              id="audience"
              label="Target audience (optional)"
              value={form.audience}
              onChange={(value) => updateForm("audience", value)}
            />
            <Field
              id="goal"
              label="Primary goal (optional)"
              value={form.goal}
              onChange={(value) => updateForm("goal", value)}
            />
            <div className="field">
              <label htmlFor="generation-mode">Generation mode</label>
              <select
                id="generation-mode"
                value={form.mode}
                onChange={(event) =>
                  updateForm("mode", event.target.value as GenerateInput["mode"])
                }
              >
                <option value="demo">Demo · Free, deterministic</option>
                <option value="live">Live AI · Opt-in provider</option>
              </select>
            </div>
            <p className="note">
              Demo uses fixtures and templates, not a paid model. Live requires an explicitly
              enabled server provider and may incur API charges.
            </p>
            <button className="primary full" type="submit" disabled={busy}>
              {busy ? "Generating..." : "Generate website"}
            </button>
          </form>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {notice && (
            <p className="success" role="status">
              {notice}
            </p>
          )}
          <div className="separator" />
          <div className="button-row">
            <button
              className="secondary small"
              type="button"
              onClick={saveVersion}
              disabled={!site}
            >
              Save version
            </button>
            <button className="ghost small" type="button" onClick={onExport} disabled={!site}>
              Export ZIP
            </button>
          </div>
          <p className="note">
            Changes auto-save locally in this browser. No account or cloud sync.
          </p>
        </section>

        <section aria-labelledby="preview-heading">
          <div className="workspace-title">
            <div>
              <span className="eyebrow">02 / Preview</span>
              <h1 id="preview-heading">{showing ? showing.name : "Your canvas awaits"}</h1>
              <p>
                {candidate
                  ? "Proposed regeneration, not yet applied"
                  : showing
                    ? "Responsive preview in a sandboxed frame"
                    : "Generate a site to see the preview"}
              </p>
            </div>
            {showing && <span className="pill">{displayName(showing.category)}</span>}
          </div>
          <div className="preview-toolbar">
            <div className="segmented" aria-label="Preview device">
              <button
                type="button"
                aria-pressed={device === "desktop"}
                onClick={() => setDevice("desktop")}
              >
                Desktop
              </button>
              <button
                type="button"
                aria-pressed={device === "mobile"}
                onClick={() => setDevice("mobile")}
              >
                Mobile
              </button>
            </div>
            <span className="muted">{device === "mobile" ? "390 px" : "Fluid desktop"}</span>
          </div>
          <div className="preview-shell">
            {showing ? (
              <div className={"preview-device " + device}>
                <iframe
                  title="Website preview"
                  srcDoc={html}
                  sandbox=""
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="empty-state">
                <div className="illustration" aria-hidden="true">
                  ✦
                </div>
                <h2>From words to a website</h2>
                <p>Choose a category, enter your prompt and generate a responsive preview.</p>
              </div>
            )}
          </div>
          {candidate && (
            <div className="panel" style={{ marginTop: 14 }}>
              <h2>Review proposed changes</h2>
              <p className="lead">The original website remains unchanged until you accept.</p>
              <div className="button-row">
                <button className="primary" type="button" onClick={acceptCandidate}>
                  Accept change
                </button>
                <button
                  className="ghost"
                  type="button"
                  onClick={() => {
                    setCandidate(null);
                    setNotice("Proposed change rejected.");
                  }}
                >
                  Reject change
                </button>
              </div>
            </div>
          )}
        </section>

        <aside className="panel" aria-labelledby="editor-heading">
          <span className="eyebrow">03 / Edit</span>
          <h2 id="editor-heading">Visual editor</h2>
          <p className="lead">
            Edit content and reorder sections without executing generated code. Text changes apply when you leave each field.
          </p>
          {site ? (
            <>
              <div className="field">
                <label htmlFor="active-theme">Website theme</label>
                <select
                  id="active-theme"
                  value={site.theme}
                  onChange={(event) => {
                    const theme = event.target.value as Theme;
                    applySite({ ...site, theme, palette: { ...palettes[theme] } });
                  }}
                >
                  {themes.map((theme) => (
                    <option key={theme} value={theme}>
                      {themeLabels[theme]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="button-row" style={{ marginBottom: 14 }}>
                {(["background", "text", "primary", "accent"] as const).map((color) => (
                  <div
                    className="field"
                    key={color}
                    style={{ width: "calc(50% - 5px)", margin: 0 }}
                  >
                    <label htmlFor={"color-" + color}>{displayName(color)}</label>
                    <input
                      id={"color-" + color}
                      type="color"
                      value={site.palette[color]}
                      onChange={(event) =>
                        applySite({
                          ...site,
                          palette: { ...site.palette, [color]: event.target.value },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
              <div className="separator" />
              <div className="field-label" style={{ marginBottom: 12 }}>
                Sections
              </div>
              <div className="section-list">
                {site.sections.map((section) => (
                  <div className="section-entry" key={section.id}>
                    <button
                      type="button"
                      aria-current={selectedId === section.id ? "true" : undefined}
                      onClick={() => setSelectedId(section.id)}
                    >
                      {section.title}
                      <span className="section-meta">
                        {displayName(section.type)}
                        {section.hidden ? " · Hidden" : ""}
                      </span>
                    </button>
                    {selectedId === section.id && (
                      <button
                        className="tiny"
                        type="button"
                        title="Move section up"
                        aria-label="Move section up"
                        onClick={() => moveSection(-1)}
                      >
                        ↑
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="field">
                <label htmlFor="new-section">Add a component</label>
                <select
                  id="new-section"
                  value={newSectionType}
                  onChange={(event) => setNewSectionType(event.target.value as SectionType)}
                >
                  {sectionTypes.map((type) => (
                    <option key={type} value={type}>
                      {displayName(type)}
                    </option>
                  ))}
                </select>
              </div>
              <button className="secondary full small" type="button" onClick={addSection}>
                + Add section
              </button>
              {selected && (
                <>
                  <div className="separator" />
                  <p className="field-label">Editing: {displayName(selected.type)}</p>
                  <EditableField
                    key={selected.id + "-title-" + selected.title}
                    id="section-title"
                    label="Heading"
                    value={selected.title}
                    onCommit={(value) => updateSection({ title: value })}
                  />
                  <EditableField
                    key={selected.id + "-description-" + selected.description}
                    id="section-description"
                    label="Description"
                    value={selected.description}
                    onCommit={(value) => updateSection({ description: value })}
                    multiline
                  />
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={selected.hidden}
                      onChange={(event) => updateSection({ hidden: event.target.checked })}
                    />
                    Hide this section
                  </label>
                  {selected.action ? (
                    <>
                      <EditableField
                        key={selected.id + "-action-label-" + selected.action.label}
                        id="action-label"
                        label="Button label"
                        value={selected.action.label}
                        onCommit={(value) =>
                          updateSection({ action: { ...selected.action!, label: value } })
                        }
                      />
                      <EditableField
                        key={selected.id + "-action-url-" + selected.action.href}
                        id="action-url"
                        label="Button link"
                        value={selected.action.href}
                        onCommit={(value) =>
                          updateSection({ action: { ...selected.action!, href: value } })
                        }
                      />
                      <button
                        className="ghost small"
                        type="button"
                        onClick={() => updateSection({ action: undefined })}
                      >
                        Remove button
                      </button>
                    </>
                  ) : (
                    <button
                      className="ghost small"
                      type="button"
                      onClick={() =>
                        updateSection({ action: { label: "Learn more", href: "#contact" } })
                      }
                    >
                      + Add button
                    </button>
                  )}
                  <div className="separator" />
                  <div className="field">
                    <label htmlFor="section-image-url">Image URL (approved HTTPS hosts)</label>
                    <input
                      id="section-image-url"
                      key={selected.id + (selected.image?.url ?? "")}
                      type="url"
                      defaultValue={selected.image?.url ?? ""}
                      placeholder="https://placehold.co/1200x630/png"
                      onBlur={(event) => {
                        const url = event.target.value.trim();
                        updateSection({
                          image: url
                            ? { url, alt: selected.image?.alt ?? "Illustrative image" }
                            : undefined,
                        });
                      }}
                    />
                  </div>
                  {selected.image && (
                    <EditableField
                      key={selected.id + "-image-alt-" + selected.image.alt}
                      id="section-image-alt"
                      label="Image alternative text"
                      value={selected.image.alt}
                      onCommit={(value) =>
                        updateSection({ image: { ...selected.image!, alt: value } })
                      }
                    />
                  )}
                  <button
                    className="ghost small"
                    type="button"
                    onClick={() =>
                      updateSection({
                        image: {
                          url: "https://placehold.co/1200x630/png",
                          alt: "Illustrative placeholder",
                        },
                      })
                    }
                  >
                    Use placeholder image
                  </button>
                  {selected.items.map((item, index) => (
                    <div key={index} style={{ marginTop: 14 }}>
                      <p className="field-label">Card {index + 1}</p>
                      <EditableField
                        key={selected.id + "-card-" + index + "-heading-" + item.heading}
                        id={"item-heading-" + index}
                        label="Card heading"
                        value={item.heading}
                        onCommit={(value) =>
                          updateSection({
                            items: selected.items.map((entry, i) =>
                              i === index ? { ...entry, heading: value } : entry,
                            ),
                          })
                        }
                      />
                      <EditableField
                        key={selected.id + "-card-" + index + "-text-" + item.text}
                        id={"item-text-" + index}
                        label="Card description"
                        value={item.text}
                        onCommit={(value) =>
                          updateSection({
                            items: selected.items.map((entry, i) =>
                              i === index ? { ...entry, text: value } : entry,
                            ),
                          })
                        }
                        multiline
                      />
                      <button
                        className="ghost small"
                        type="button"
                        onClick={() =>
                          updateSection({
                            items: selected.items.filter((_, i) => i !== index),
                          })
                        }
                      >
                        Remove card
                      </button>
                    </div>
                  ))}
                  <div className="button-row" style={{ marginTop: 14 }}>
                    <button
                      className="secondary small"
                      type="button"
                      disabled={selected.items.length >= 8}
                      onClick={() =>
                        updateSection({
                          items: [
                            ...selected.items,
                            { heading: "New item", text: "Describe this item." },
                          ],
                        })
                      }
                    >
                      + Add card
                    </button>
                    <button className="ghost small" type="button" onClick={() => moveSection(1)}>
                      Move down
                    </button>
                    <button
                      className="danger small"
                      type="button"
                      onClick={removeSection}
                      disabled={site.sections.length <= 2}
                    >
                      Remove section
                    </button>
                  </div>
                  <div className="separator" />
                  <Field
                    id="regenerate-instruction"
                    label="Regenerate selected section"
                    value={instruction}
                    onChange={setInstruction}
                    multiline
                    placeholder="Make this section more concise..."
                  />
                  <button
                    className="secondary full"
                    type="button"
                    onClick={onRegenerate}
                    disabled={busy || instruction.trim().length < 5 || !!candidate}
                  >
                    {busy ? "Working..." : "Propose change"}
                  </button>
                  <p className="note">
                    Only the selected section can change. Review before accepting.
                  </p>
                </>
              )}
              <div className="separator" />
              <h2>Version history</h2>
              <p className="lead">Up to 15 local checkpoints. Restore any saved version.</p>
              {history.length > 0 && (
                <p className="note">
                  Comparison with latest checkpoint:{" "}
                  {site.sections.filter(
                    (section) =>
                      JSON.stringify(section) !==
                      JSON.stringify(history[0].site.sections.find((old) => old.id === section.id)),
                  ).length +
                    history[0].site.sections.filter(
                      (old) => !site.sections.some((section) => section.id === old.id),
                    ).length}{" "}
                  added, removed or modified sections.
                </p>
              )}
              <div className="history-list">
                {history.length ? (
                  history.map((snapshot) => (
                    <div className="history-entry" key={snapshot.id}>
                      <div>
                        <strong>{snapshot.description}</strong>
                        <span>{new Date(snapshot.createdAt).toLocaleString()}</span>
                      </div>
                      <button
                        className="ghost small"
                        type="button"
                        onClick={() => restoreVersion(snapshot)}
                      >
                        Restore
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="note">No checkpoints saved.</p>
                )}
              </div>
            </>
          ) : (
            <p className="note">Your components and version history appear after generation.</p>
          )}
        </aside>
      </div>
    </main>
  );
}
