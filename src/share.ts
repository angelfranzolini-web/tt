import type { AppState, CardData } from "./types";
import { boardName, columnTitle, displaySite } from "./utils";

export interface SharedCard {
  title: string;
  color: CardData["color"];
  assignees: string[];
  note?: string;
  dueDate?: string;
  priority?: CardData["priority"];
  description?: string;
  statusLabel: string;
  log: { author: string; date: string; text: string }[];
}

export interface SharePayload {
  kind: "site" | "board";
  name: string;
  generatedAt: string;
  cards: SharedCard[];
}

function toShared(state: AppState, card: CardData): SharedCard {
  return {
    title: card.title,
    color: card.color,
    assignees: card.assignees,
    note: card.note,
    dueDate: card.dueDate,
    priority: card.priority,
    description: card.description,
    statusLabel: `${boardName(state, card.boardId)} · ${columnTitle(state, card.columnId)}`,
    log: card.log.map((l) => ({ author: l.author, date: l.date, text: l.text })),
  };
}

export function buildSitePayload(state: AppState, site: string): SharePayload {
  const cards = state.cards.filter((c) => displaySite(c) === site);
  return {
    kind: "site",
    name: site,
    generatedAt: new Date().toISOString(),
    cards: cards.map((c) => toShared(state, c)),
  };
}

export function buildBoardPayload(state: AppState, boardId: string): SharePayload {
  const name = boardName(state, boardId);
  const cards = state.cards.filter((c) => c.boardId === boardId);
  return {
    kind: "board",
    name,
    generatedAt: new Date().toISOString(),
    cards: cards.map((c) => toShared(state, c)),
  };
}

function encodeBase64Url(json: string): string {
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeBase64Url(encoded: string): string {
  let b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function buildShareLink(payload: SharePayload): string {
  const encoded = encodeBase64Url(JSON.stringify(payload));
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#share=${encoded}`;
}

export function decodeSharePayloadFromHash(hash: string): SharePayload | null {
  const prefix = "#share=";
  if (!hash.startsWith(prefix)) return null;
  try {
    const json = decodeBase64Url(hash.slice(prefix.length));
    return JSON.parse(json) as SharePayload;
  } catch {
    return null;
  }
}
