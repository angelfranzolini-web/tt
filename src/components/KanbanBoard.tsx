import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
} from "@dnd-kit/core";
import type { CardData } from "../types";
import { useStore } from "../store";
import ColumnView from "./ColumnView";
import ShareButton from "./ShareButton";
import { buildBoardPayload, buildShareLink } from "../share";

interface Props {
  boardId: string;
  onOpenCard: (card: CardData) => void;
}

export default function KanbanBoard({ boardId, onOpenCard }: Props) {
  const { state, dispatch } = useStore();
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColTitle, setNewColTitle] = useState("");

  const board = state.boards.find((b) => b.id === boardId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const columns = state.columns
    .filter((c) => c.boardId === boardId)
    .sort((a, b) => a.order - b.order);
  const cards = state.cards.filter((c) => c.boardId === boardId);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeCard = cards.find((c) => c.id === active.id);
    if (!activeCard) return;

    const overId = String(over.id);
    let toColumnId: string;
    let toIndex: number;

    if (overId.startsWith("coldrop-")) {
      toColumnId = overId.replace("coldrop-", "");
      toIndex = cards.filter((c) => c.columnId === toColumnId && c.id !== activeCard.id).length;
    } else {
      const overCard = cards.find((c) => c.id === overId);
      if (!overCard) return;
      toColumnId = overCard.columnId;
      const siblings = cards
        .filter((c) => c.columnId === toColumnId && c.id !== activeCard.id)
        .sort((a, b) => a.order - b.order);
      toIndex = siblings.findIndex((c) => c.id === overCard.id);
      if (toIndex === -1) toIndex = siblings.length;
    }

    if (toColumnId === activeCard.columnId && toIndex === activeCard.order) return;
    dispatch({ type: "MOVE_CARD", cardId: activeCard.id, toColumnId, toIndex });
  }

  function addColumn() {
    const t = newColTitle.trim();
    if (t) dispatch({ type: "ADD_COLUMN", boardId, title: t });
    setNewColTitle("");
    setAddingColumn(false);
  }

  function renameBoard() {
    if (!board) return;
    const next = window.prompt("Nouveau nom du tableau :", board.name);
    if (next && next.trim()) dispatch({ type: "RENAME_BOARD", boardId, name: next.trim() });
  }

  function deleteBoard() {
    if (!board) return;
    if (state.boards.length <= 1) {
      window.alert("Impossible de supprimer le dernier tableau.");
      return;
    }
    if (window.confirm(`Supprimer le tableau « ${board.name} » et toutes ses étiquettes ?`)) {
      dispatch({ type: "DELETE_BOARD", boardId });
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="board-toolbar">
        <button className="icon-text-btn" onClick={renameBoard}>
          ✎ Renommer le tableau
        </button>
        <button className="icon-text-btn" onClick={deleteBoard}>
          🗑 Supprimer le tableau
        </button>
        <ShareButton
          label="🔗 Partager ce tableau"
          buildLink={() => buildShareLink(buildBoardPayload(state, boardId))}
        />
      </div>
      <div className="board-grid">
        {columns.map((col) => (
          <ColumnView
            key={col.id}
            column={col}
            cards={cards.filter((c) => c.columnId === col.id)}
            onOpenCard={onOpenCard}
            onAddCard={(columnId, title) => dispatch({ type: "ADD_CARD", boardId, columnId, title })}
            onRenameColumn={(columnId, title) => dispatch({ type: "RENAME_COLUMN", columnId, title })}
            onDeleteColumn={(columnId) => dispatch({ type: "DELETE_COLUMN", columnId })}
          />
        ))}
        <div className="board-column add-column">
          {addingColumn ? (
            <div className="add-card-form">
              <input
                autoFocus
                value={newColTitle}
                onChange={(e) => setNewColTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addColumn();
                  if (e.key === "Escape") setAddingColumn(false);
                }}
                placeholder="Nom de la colonne…"
              />
              <div className="add-card-actions">
                <button onClick={addColumn}>Ajouter</button>
                <button className="ghost" onClick={() => setAddingColumn(false)}>
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <button className="add-card-trigger" onClick={() => setAddingColumn(true)}>
              + Nouvelle colonne
            </button>
          )}
        </div>
      </div>
    </DndContext>
  );
}
