import { websiteSchema, type Website } from "./schema";
import { z } from "zod";

export const STORAGE_KEY = "website-generator-v1";
export const MAX_VERSIONS = 15;
export const snapshotSchema = z.object({
  id: z.string(),
  description: z.string().max(240),
  createdAt: z.string(),
  site: websiteSchema,
}).strict();
export type Snapshot = z.infer<typeof snapshotSchema>;

const stateSchema = z.object({
  current: websiteSchema.nullable(),
  history: z.array(snapshotSchema).max(MAX_VERSIONS),
}).strict();

export function loadState(raw: string | null): { current: Website | null; history: Snapshot[] } {
  if (!raw || raw.length > 1600000) return { current: null, history: [] };
  try {
    return stateSchema.parse(JSON.parse(raw));
  } catch {
    return { current: null, history: [] };
  }
}

export function makeSnapshot(site: Website, description: string): Snapshot {
  return {
    id: crypto.randomUUID(), createdAt: new Date().toISOString(),
    description: description.slice(0, 240), site: structuredClone(websiteSchema.parse(site)),
  };
}

export function addSnapshot(history: Snapshot[], snapshot: Snapshot): Snapshot[] {
  return [snapshot, ...history].slice(0, MAX_VERSIONS);
}
