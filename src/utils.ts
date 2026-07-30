import type { AppState, CardData, SiteData } from "./types";

export function siteById(state: AppState, siteId?: string): SiteData | undefined {
  if (!siteId) return undefined;
  return state.sites.find((s) => s.id === siteId);
}

export function siteName(state: AppState, card: CardData): string | undefined {
  return siteById(state, card.siteId)?.name;
}

// Finds a registered site whose name appears in the given free text (ticket
// title, description…), ignoring accents/case/ligatures. Longer site names
// are checked first so a specific site isn't shadowed by a shorter one that
// happens to be a substring of it.
export function detectSiteId(text: string, sites: SiteData[]): string | undefined {
  const haystack = siteKey(text);
  if (!haystack) return undefined;
  const candidates = [...sites].sort((a, b) => b.name.length - a.name.length);
  for (const site of candidates) {
    const needle = siteKey(site.name);
    if (needle.length >= 3 && haystack.includes(needle)) return site.id;
  }
  return undefined;
}

// Groups equivalent site names together regardless of accents, case, ligatures
// (œ/æ don't decompose under NFD), or hyphen/space differences — so
// "Sacré-Cœur", "sacre coeur" and "SACRÉ COEUR" all resolve to the same key.
export function siteKey(site: string): string {
  return site
    .replace(/œ/gi, "oe")
    .replace(/æ/gi, "ae")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function columnTitle(state: AppState, columnId: string): string {
  return state.columns.find((c) => c.id === columnId)?.title ?? "?";
}

export function boardName(state: AppState, boardId: string): string {
  return state.boards.find((b) => b.id === boardId)?.name ?? "?";
}

export function isOverdue(card: CardData): boolean {
  if (!card.dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(card.dueDate) < today;
}

export function isToday(card: CardData): boolean {
  if (!card.dueDate) return false;
  const today = new Date().toISOString().slice(0, 10);
  return card.dueDate === today;
}

export function formatDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}
