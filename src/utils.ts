import type { AppState, CardData } from "./types";

export function displaySite(card: CardData): string {
  return card.site && card.site.trim() ? card.site.trim() : card.title;
}

// Canonical list of known site names (one per normalized key, using the
// most-used spelling), for autocompletion when tagging a card's site.
export function getKnownSites(cards: CardData[]): string[] {
  const counts = new Map<string, Map<string, number>>();
  for (const card of cards) {
    const raw = displaySite(card);
    const key = siteKey(raw);
    if (!counts.has(key)) counts.set(key, new Map());
    const byLabel = counts.get(key)!;
    byLabel.set(raw, (byLabel.get(raw) ?? 0) + 1);
  }
  const labels: string[] = [];
  for (const byLabel of counts.values()) {
    let best = "";
    let bestCount = 0;
    for (const [label, count] of byLabel) {
      if (count > bestCount) {
        bestCount = count;
        best = label;
      }
    }
    labels.push(best);
  }
  return labels.sort((a, b) => a.localeCompare(b, "fr"));
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
