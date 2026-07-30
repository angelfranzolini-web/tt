import type { AppState, CardData } from "./types";

export function displaySite(card: CardData): string {
  return card.site && card.site.trim() ? card.site.trim() : card.title;
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
