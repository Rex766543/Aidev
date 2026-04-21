import { apiFetch } from "./client";

export interface StyleEntry {
  genre: string;
  style: string;
}

let cache: StyleEntry[] | null = null;

export async function getAllStyles(): Promise<StyleEntry[]> {
  if (cache) return cache;
  const data = await apiFetch<{ items: StyleEntry[] }>("/api/styles");
  cache = data.items;
  return cache;
}
