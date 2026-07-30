import type { AppState, BoardData, CardData, ColumnData, LogEntry, SiteData } from "../types";
import { detectSiteId, siteKey } from "../utils";

export type Action =
  | { type: "MOVE_CARD"; cardId: string; toColumnId: string; toIndex: number }
  | { type: "UPDATE_CARD"; cardId: string; patch: Partial<CardData> }
  | { type: "ADD_CARD"; boardId: string; columnId: string; title: string; siteId?: string }
  | { type: "DELETE_CARD"; cardId: string }
  | { type: "ADD_LOG"; cardId: string; entry: LogEntry }
  | { type: "ADD_BOARD"; board: BoardData; columns: string[] }
  | { type: "RENAME_BOARD"; boardId: string; name: string }
  | { type: "DELETE_BOARD"; boardId: string }
  | { type: "ADD_COLUMN"; boardId: string; title: string }
  | { type: "RENAME_COLUMN"; columnId: string; title: string }
  | { type: "DELETE_COLUMN"; columnId: string }
  | { type: "ADD_SITE"; name: string }
  | { type: "RENAME_SITE"; siteId: string; name: string }
  | { type: "DELETE_SITE"; siteId: string }
  | { type: "ENSURE_SITE_SHARE"; siteId: string; shareId: string }
  | { type: "ENSURE_BOARD_SHARE"; boardId: string; shareId: string };

export interface RawStoredState {
  boards: BoardData[];
  columns: ColumnData[];
  cards: (CardData & { site?: string })[];
  sites?: SiteData[];
}

const LOCKED_BOARD_IDS = new Set(["board-general", "board-today"]);

// The "Fait" column of the "À faire aujourd'hui" board isn't a real
// destination — dropping a ticket there marks it done and clears it from
// the board right away, so the board stays a clean daily list instead of
// piling up finished tasks forever.
export const AUTO_COMPLETE_COLUMN_ID = "col-today-fait";

// Older stored states used a free-text `card.site` string instead of a
// `siteId` referencing a registered site. Convert that data on load instead
// of discarding it, so nobody loses tickets they'd already tagged. Also
// re-applies the "locked" flag on the two default boards for states saved
// before that flag existed.
export function migrate(raw: RawStoredState): AppState {
  const boards = raw.boards.map((b) => (LOCKED_BOARD_IDS.has(b.id) ? { ...b, locked: true } : b));

  if (raw.sites) return { ...raw, boards } as AppState;

  const sites: SiteData[] = [];
  const idByKey = new Map<string, string>();
  const cards = raw.cards.map((card) => {
    const { site, ...rest } = card;
    if (!site || !site.trim()) return rest;
    const key = siteKey(site.trim());
    let id = idByKey.get(key);
    if (!id) {
      id = `site-migrated-${sites.length}`;
      idByKey.set(key, id);
      sites.push({ id, name: site.trim() });
    }
    return { ...rest, siteId: id };
  });
  return { ...raw, boards, cards, sites };
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "MOVE_CARD": {
      const moving = state.cards.find((c) => c.id === action.cardId);
      if (!moving) return state;
      if (action.toColumnId === AUTO_COMPLETE_COLUMN_ID) {
        return { ...state, cards: state.cards.filter((c) => c.id !== action.cardId) };
      }
      const withoutMoving = state.cards.filter((c) => c.id !== action.cardId);
      const destSiblings = withoutMoving
        .filter((c) => c.columnId === action.toColumnId)
        .sort((a, b) => a.order - b.order);
      const clampedIndex = Math.max(0, Math.min(action.toIndex, destSiblings.length));
      destSiblings.splice(clampedIndex, 0, { ...moving, columnId: action.toColumnId });
      const reordered = destSiblings.map((c, i) => ({ ...c, order: i }));
      const otherCards = withoutMoving.filter((c) => c.columnId !== action.toColumnId);
      return { ...state, cards: [...otherCards, ...reordered] };
    }
    case "UPDATE_CARD":
      if (action.patch.columnId === AUTO_COMPLETE_COLUMN_ID) {
        return { ...state, cards: state.cards.filter((c) => c.id !== action.cardId) };
      }
      return {
        ...state,
        cards: state.cards.map((c) => (c.id === action.cardId ? { ...c, ...action.patch } : c)),
      };
    case "ADD_CARD": {
      const siblings = state.cards.filter((c) => c.columnId === action.columnId);
      const newCard: CardData = {
        id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        boardId: action.boardId,
        columnId: action.columnId,
        order: siblings.length,
        title: action.title,
        color: "yellow",
        assignees: [],
        log: [],
        siteId: action.siteId ?? detectSiteId(action.title, state.sites),
      };
      return { ...state, cards: [...state.cards, newCard] };
    }
    case "DELETE_CARD":
      return { ...state, cards: state.cards.filter((c) => c.id !== action.cardId) };
    case "ADD_LOG":
      return {
        ...state,
        cards: state.cards.map((c) =>
          c.id === action.cardId ? { ...c, log: [...c.log, action.entry] } : c
        ),
      };
    case "ADD_BOARD": {
      const newColumns: ColumnData[] = action.columns.map((title, i) => ({
        id: `col-${Date.now()}-${i}`,
        boardId: action.board.id,
        title,
        order: i,
      }));
      return {
        ...state,
        boards: [...state.boards, action.board],
        columns: [...state.columns, ...newColumns],
      };
    }
    case "ADD_COLUMN": {
      if (state.boards.find((b) => b.id === action.boardId)?.locked) return state;
      const siblings = state.columns.filter((c) => c.boardId === action.boardId);
      const newColumn: ColumnData = {
        id: `col-${Date.now()}`,
        boardId: action.boardId,
        title: action.title,
        order: siblings.length,
      };
      return { ...state, columns: [...state.columns, newColumn] };
    }
    case "RENAME_COLUMN": {
      const column = state.columns.find((c) => c.id === action.columnId);
      if (!column || state.boards.find((b) => b.id === column.boardId)?.locked) return state;
      return {
        ...state,
        columns: state.columns.map((c) => (c.id === action.columnId ? { ...c, title: action.title } : c)),
      };
    }
    case "DELETE_COLUMN": {
      const column = state.columns.find((c) => c.id === action.columnId);
      if (!column || state.boards.find((b) => b.id === column.boardId)?.locked) return state;
      return {
        ...state,
        columns: state.columns.filter((c) => c.id !== action.columnId),
        cards: state.cards.filter((c) => c.columnId !== action.columnId),
      };
    }
    case "RENAME_BOARD": {
      if (state.boards.find((b) => b.id === action.boardId)?.locked) return state;
      return {
        ...state,
        boards: state.boards.map((b) => (b.id === action.boardId ? { ...b, name: action.name } : b)),
      };
    }
    case "DELETE_BOARD": {
      if (state.boards.find((b) => b.id === action.boardId)?.locked) return state;
      return {
        ...state,
        boards: state.boards.filter((b) => b.id !== action.boardId),
        columns: state.columns.filter((c) => c.boardId !== action.boardId),
        cards: state.cards.filter((c) => c.boardId !== action.boardId),
      };
    }
    case "ADD_SITE": {
      const newSite: SiteData = { id: `site-${Date.now()}`, name: action.name };
      return { ...state, sites: [...state.sites, newSite] };
    }
    case "RENAME_SITE":
      return {
        ...state,
        sites: state.sites.map((s) => (s.id === action.siteId ? { ...s, name: action.name } : s)),
      };
    case "DELETE_SITE":
      return {
        ...state,
        sites: state.sites.filter((s) => s.id !== action.siteId),
        cards: state.cards.map((c) => (c.siteId === action.siteId ? { ...c, siteId: undefined } : c)),
      };
    case "ENSURE_SITE_SHARE": {
      const site = state.sites.find((s) => s.id === action.siteId);
      if (!site || site.shareId) return state; // already has one — first write wins
      return {
        ...state,
        sites: state.sites.map((s) => (s.id === action.siteId ? { ...s, shareId: action.shareId } : s)),
      };
    }
    case "ENSURE_BOARD_SHARE": {
      const board = state.boards.find((b) => b.id === action.boardId);
      if (!board || board.shareId) return state;
      return {
        ...state,
        boards: state.boards.map((b) => (b.id === action.boardId ? { ...b, shareId: action.shareId } : b)),
      };
    }
    default:
      return state;
  }
}
