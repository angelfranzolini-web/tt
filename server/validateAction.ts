import type { Action } from "../src/shared/reducer";
import type { CardColor, CardData } from "../src/types";

// Runtime allow-list for actions coming over the WebSocket. The client's TS
// types give no guarantee at runtime — a compromised or buggy client could
// send anything. This rejects anything that doesn't match the exact shape we
// expect, with sane length limits, before it ever reaches the reducer.

const MAX_SHORT = 300; // titles, names, single-line fields
const MAX_LONG = 5000; // descriptions, log entries
const MAX_ARRAY = 200; // assignees, columns lists

const CARD_COLORS = new Set<CardColor>(["red", "orange", "yellow", "green", "blue"]);
const PRIORITIES = new Set(["faible", "moyenne", "urgente"]);

function isStr(v: unknown, max = MAX_SHORT): v is string {
  return typeof v === "string" && v.length <= max;
}

function isOptStr(v: unknown, max = MAX_SHORT): boolean {
  return v === undefined || isStr(v, max);
}

function isStrArray(v: unknown, maxItems = MAX_ARRAY, maxLen = MAX_SHORT): v is string[] {
  return Array.isArray(v) && v.length <= maxItems && v.every((x) => isStr(x, maxLen));
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function validCardPatch(v: unknown): boolean {
  if (!isPlainObject(v)) return false;
  const allowed = new Set([
    "title",
    "color",
    "assignees",
    "siteId",
    "note",
    "dueDate",
    "priority",
    "description",
  ]);
  for (const key of Object.keys(v)) {
    if (!allowed.has(key)) return false;
  }
  if (v.title !== undefined && !isStr(v.title)) return false;
  if (v.color !== undefined && !CARD_COLORS.has(v.color as CardColor)) return false;
  if (v.assignees !== undefined && !isStrArray(v.assignees)) return false;
  if (v.siteId !== undefined && v.siteId !== null && !isStr(v.siteId)) return false;
  if (v.note !== undefined && v.note !== null && !isStr(v.note, MAX_LONG)) return false;
  if (v.dueDate !== undefined && v.dueDate !== null && !isStr(v.dueDate, 20)) return false;
  if (v.priority !== undefined && !PRIORITIES.has(v.priority as string)) return false;
  if (v.description !== undefined && v.description !== null && !isStr(v.description, MAX_LONG)) return false;
  return true;
}

export function validateAction(raw: unknown): Action | null {
  if (!isPlainObject(raw) || typeof raw.type !== "string") return null;
  const a = raw as Record<string, unknown>;

  switch (a.type) {
    case "MOVE_CARD":
      if (isStr(a.cardId) && isStr(a.toColumnId) && typeof a.toIndex === "number" && Number.isFinite(a.toIndex)) {
        return { type: "MOVE_CARD", cardId: a.cardId, toColumnId: a.toColumnId, toIndex: a.toIndex };
      }
      return null;

    case "UPDATE_CARD":
      if (isStr(a.cardId) && validCardPatch(a.patch)) {
        return { type: "UPDATE_CARD", cardId: a.cardId, patch: a.patch as Partial<CardData> };
      }
      return null;

    case "ADD_CARD":
      if (isStr(a.boardId) && isStr(a.columnId) && isStr(a.title) && isOptStr(a.siteId)) {
        return {
          type: "ADD_CARD",
          boardId: a.boardId,
          columnId: a.columnId,
          title: a.title,
          siteId: a.siteId as string | undefined,
        };
      }
      return null;

    case "DELETE_CARD":
      if (isStr(a.cardId)) return { type: "DELETE_CARD", cardId: a.cardId };
      return null;

    case "ADD_LOG":
      if (
        isStr(a.cardId) &&
        isPlainObject(a.entry) &&
        isStr(a.entry.id) &&
        isStr(a.entry.date, 40) &&
        isStr(a.entry.author, MAX_SHORT) &&
        isStr(a.entry.text, MAX_LONG)
      ) {
        return {
          type: "ADD_LOG",
          cardId: a.cardId,
          entry: {
            id: a.entry.id,
            date: a.entry.date,
            author: a.entry.author,
            text: a.entry.text,
          },
        };
      }
      return null;

    case "ADD_BOARD":
      if (
        isPlainObject(a.board) &&
        isStr(a.board.id) &&
        isStr(a.board.name) &&
        isOptStr(a.board.icon, 10) &&
        isStrArray(a.columns, 50)
      ) {
        return {
          type: "ADD_BOARD",
          board: { id: a.board.id, name: a.board.name, icon: a.board.icon as string | undefined },
          columns: a.columns as string[],
        };
      }
      return null;

    case "RENAME_BOARD":
      if (isStr(a.boardId) && isStr(a.name)) return { type: "RENAME_BOARD", boardId: a.boardId, name: a.name };
      return null;

    case "DELETE_BOARD":
      if (isStr(a.boardId)) return { type: "DELETE_BOARD", boardId: a.boardId };
      return null;

    case "ADD_COLUMN":
      if (isStr(a.boardId) && isStr(a.title)) return { type: "ADD_COLUMN", boardId: a.boardId, title: a.title };
      return null;

    case "RENAME_COLUMN":
      if (isStr(a.columnId) && isStr(a.title)) return { type: "RENAME_COLUMN", columnId: a.columnId, title: a.title };
      return null;

    case "DELETE_COLUMN":
      if (isStr(a.columnId)) return { type: "DELETE_COLUMN", columnId: a.columnId };
      return null;

    case "ADD_SITE":
      if (isStr(a.name)) return { type: "ADD_SITE", name: a.name };
      return null;

    case "RENAME_SITE":
      if (isStr(a.siteId) && isStr(a.name)) return { type: "RENAME_SITE", siteId: a.siteId, name: a.name };
      return null;

    case "DELETE_SITE":
      if (isStr(a.siteId)) return { type: "DELETE_SITE", siteId: a.siteId };
      return null;

    case "ENSURE_SITE_SHARE":
      if (isStr(a.siteId) && isStr(a.shareId, 100)) {
        return { type: "ENSURE_SITE_SHARE", siteId: a.siteId, shareId: a.shareId };
      }
      return null;

    case "ENSURE_BOARD_SHARE":
      if (isStr(a.boardId) && isStr(a.shareId, 100)) {
        return { type: "ENSURE_BOARD_SHARE", boardId: a.boardId, shareId: a.shareId };
      }
      return null;

    default:
      return null;
  }
}
