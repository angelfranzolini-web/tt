import type { AppState, BoardData, CardData, ColumnData, LogEntry, SiteData, UserData } from "../types";
import { deriveUsersFromCards, detectSiteId, siteKey } from "../utils";

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
  | { type: "ADD_USER"; name: string }
  | { type: "RENAME_USER"; userId: string; name: string }
  | { type: "DELETE_USER"; userId: string }
  | { type: "ENSURE_SITE_SHARE"; siteId: string; shareId: string }
  | { type: "ENSURE_BOARD_SHARE"; boardId: string; shareId: string };

export interface RawStoredState {
  boards: BoardData[];
  columns: ColumnData[];
  cards: (CardData & { site?: string })[];
  sites?: SiteData[];
  users?: UserData[];
}

const LOCKED_BOARD_IDS = new Set(["board-general", "board-today", "board-action"]);

// The "Fait" column of the "À faire aujourd'hui" board isn't a real
// destination — dropping a ticket there marks it done and clears it from
// the board right away, so the board stays a clean daily list instead of
// piling up finished tasks forever.
export const AUTO_COMPLETE_COLUMN_ID = "col-today-fait";

const ACTION_BOARD_ID = "board-action";
const ACTION_COLUMN_ID = "col-action-rows";

// Adds the "Tableau d'action" (flat Thème/Action/Qui/Début list) to states
// saved before it existed, so it shows up for people who already have a
// running SysView instance instead of only on fresh installs. Only the
// empty board + column are added — no seed rows — so nothing is invented
// into someone's real data.
function ensureActionBoard(boards: BoardData[], columns: ColumnData[]): { boards: BoardData[]; columns: ColumnData[] } {
  if (boards.some((b) => b.id === ACTION_BOARD_ID)) return { boards, columns };
  return {
    boards: [...boards, { id: ACTION_BOARD_ID, name: "Tableau d'action", icon: "📝", locked: true, viewType: "table" }],
    columns: [...columns, { id: ACTION_COLUMN_ID, boardId: ACTION_BOARD_ID, title: "Actions", order: 0 }],
  };
}

// Older stored states used a free-text `card.site` string instead of a
// `siteId` referencing a registered site. Convert that data on load instead
// of discarding it, so nobody loses tickets they'd already tagged. Also
// re-applies the "locked" flag on the default boards for states saved
// before that flag existed, and backfills the "Tableau d'action" board.
export function migrate(raw: RawStoredState): AppState {
  const lockedBoards = raw.boards.map((b) => (LOCKED_BOARD_IDS.has(b.id) ? { ...b, locked: true } : b));
  const { boards, columns } = ensureActionBoard(lockedBoards, raw.columns);

  let sites: SiteData[];
  let cards: CardData[];
  if (raw.sites) {
    sites = raw.sites;
    cards = raw.cards;
  } else {
    sites = [];
    const idByKey = new Map<string, string>();
    cards = raw.cards.map((card) => {
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
  }

  const users = raw.users ?? deriveUsersFromCards(cards);
  return { ...raw, boards, columns, cards, sites, users };
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
    case "ADD_USER": {
      const newUser: UserData = { id: `user-${Date.now()}`, name: action.name };
      return { ...state, users: [...state.users, newUser] };
    }
    case "RENAME_USER":
      return {
        ...state,
        users: state.users.map((u) => (u.id === action.userId ? { ...u, name: action.name } : u)),
      };
    case "DELETE_USER":
      return { ...state, users: state.users.filter((u) => u.id !== action.userId) };
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
