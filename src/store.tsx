import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import type { AppState, BoardData, CardData, ColumnData, LogEntry } from "./types";
import { getSeedState } from "./seedData";

const STORAGE_KEY = "suivi-projets-state-v1";

type Action =
  | { type: "MOVE_CARD"; cardId: string; toColumnId: string; toIndex: number }
  | { type: "UPDATE_CARD"; cardId: string; patch: Partial<CardData> }
  | { type: "ADD_CARD"; boardId: string; columnId: string; title: string }
  | { type: "DELETE_CARD"; cardId: string }
  | { type: "ADD_LOG"; cardId: string; entry: LogEntry }
  | { type: "ADD_BOARD"; board: BoardData; columns: string[] }
  | { type: "ADD_COLUMN"; boardId: string; title: string }
  | { type: "RENAME_COLUMN"; columnId: string; title: string };

function loadInitial(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AppState;
  } catch {
    // ignore corrupted storage
  }
  return getSeedState();
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "MOVE_CARD": {
      const moving = state.cards.find((c) => c.id === action.cardId);
      if (!moving) return state;
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
      const siblings = state.columns.filter((c) => c.boardId === action.boardId);
      const newColumn: ColumnData = {
        id: `col-${Date.now()}`,
        boardId: action.boardId,
        title: action.title,
        order: siblings.length,
      };
      return { ...state, columns: [...state.columns, newColumn] };
    }
    case "RENAME_COLUMN":
      return {
        ...state,
        columns: state.columns.map((c) => (c.id === action.columnId ? { ...c, title: action.title } : c)),
      };
    default:
      return state;
  }
}

interface StoreContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitial);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
