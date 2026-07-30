export type CardColor = "red" | "orange" | "yellow" | "green" | "blue";

export interface LogEntry {
  id: string;
  date: string; // ISO timestamp
  author: string;
  text: string;
}

export interface CardData {
  id: string;
  boardId: string;
  columnId: string;
  order: number;
  title: string;
  color: CardColor;
  assignees: string[];
  siteId?: string;
  note?: string;
  dueDate?: string; // yyyy-mm-dd
  priority?: "faible" | "moyenne" | "urgente";
  description?: string;
  log: LogEntry[];
}

export interface ColumnData {
  id: string;
  boardId: string;
  title: string;
  order: number;
}

export interface BoardData {
  id: string;
  name: string;
  icon?: string;
  // Locked boards keep a fixed structure (name + columns can't be renamed,
  // added to, or deleted) — only their tickets can be edited. Used for the
  // default reference boards; boards created afterwards stay fully editable.
  locked?: boolean;
  // Stable, unguessable id used by the live share link (see shared/reducer's
  // ENSURE_BOARD_SHARE) — assigned once and kept forever once set.
  shareId?: string;
}

// A site is an external establishment (client premises) — a controlled,
// user-managed list, distinct from internal software/tooling tickets which
// have no site at all.
export interface SiteData {
  id: string;
  name: string;
  // Stable, unguessable id used by the live share link (see shared/reducer's
  // ENSURE_SITE_SHARE) — assigned once and kept forever once set.
  shareId?: string;
}

export interface AppState {
  boards: BoardData[];
  columns: ColumnData[];
  cards: CardData[];
  sites: SiteData[];
}

export const CARD_COLORS: { value: CardColor; label: string }[] = [
  { value: "red", label: "Rouge — Urgent" },
  { value: "yellow", label: "Jaune — Moyen" },
  { value: "green", label: "Vert — Faible" },
  { value: "blue", label: "Bleu — Maintenance" },
  { value: "orange", label: "Orange — Autre" },
];

export const PRIORITY_COLOR: Record<NonNullable<CardData["priority"]>, CardColor> = {
  faible: "green",
  moyenne: "yellow",
  urgente: "red",
};

export const COLOR_LEGEND: { color: CardColor; emoji: string; label: string }[] = [
  { color: "green", emoji: "🟢", label: "Faible" },
  { color: "yellow", emoji: "🟡", label: "Moyen" },
  { color: "red", emoji: "🔴", label: "Urgent" },
  { color: "blue", emoji: "🔵", label: "Maintenance" },
  { color: "orange", emoji: "🟠", label: "Autre" },
];
