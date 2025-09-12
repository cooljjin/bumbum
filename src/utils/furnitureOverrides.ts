/**
 * Local overrides for built-in furniture items.
 * Allows renaming, resizing, and hiding built-in items without touching bundled data.
 */

import type { FurnitureItem, FurnitureCategory } from '@/types/furniture';

export type FurnitureOverride = {
  id: string;
  name?: string;
  footprint?: { width: number; depth: number; height: number };
  hidden?: boolean;
  category?: FurnitureCategory;
  tags?: string[];
};

const STORAGE_KEY = 'bumbum_furniture_overrides_v1';

export function loadOverrides(): Record<string, FurnitureOverride> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== 'object') return {};
    return obj as Record<string, FurnitureOverride>;
  } catch {
    return {};
  }
}

export function saveOverrides(map: Record<string, FurnitureOverride>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

export function setOverride(id: string, patch: Partial<FurnitureOverride>) {
  const map = loadOverrides();
  const current = map[id] || { id };
  map[id] = { ...current, ...patch, id };
  // Clean empty keys
  if (!map[id].name && !map[id].footprint && !map[id].hidden) {
    delete map[id];
  }
  saveOverrides(map);
}

export function clearOverride(id: string) {
  const map = loadOverrides();
  delete map[id];
  saveOverrides(map);
}

export function applyOverridesToItems(items: FurnitureItem[]): FurnitureItem[] {
  const map = loadOverrides();
  return items
    .map((it) => {
      const ov = map[it.id];
      if (!ov) return it;
      const renamed = ov.name ? { ...it, name: ov.name, nameKo: ov.name } : it;
      const recategorized = ov.category ? { ...renamed, category: ov.category } : renamed;
      const tagged = ov.tags ? { ...recategorized, metadata: { ...recategorized.metadata, tags: ov.tags } } as FurnitureItem : recategorized;
      if (ov.footprint) {
        return { ...tagged, footprint: { ...tagged.footprint, ...ov.footprint } } as FurnitureItem;
      }
      return tagged;
    })
    .filter((it) => !map[it.id]?.hidden);
}

export function isOverridden(id: string): boolean {
  const map = loadOverrides();
  return !!map[id];
}

export function getOverride(id: string): FurnitureOverride | undefined {
  const map = loadOverrides();
  return map[id];
}
