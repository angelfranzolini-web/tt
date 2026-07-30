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
  site?: string;
  note?: string;
  dueDate?: string; // yyyy-mm-dd
  priority?: "normale" | "haute" | "urgente";
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
}

export interface AppState {
  boards: BoardData[];
  columns: ColumnData[];
  cards: CardData[];
}

export const CARD_COLORS: { value: CardColor; label: string }[] = [
  { value: "red", label: "Rouge" },
  { value: "orange", label: "Orange" },
  { value: "yellow", label: "Jaune" },
  { value: "green", label: "Vert" },
  { value: "blue", label: "Bleu" },
];
