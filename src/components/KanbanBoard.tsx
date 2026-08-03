import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { CardData } from "../types";
import { useStore } from "../store";
import ColumnView from "./ColumnView";
import CardDragPreview from "./CardDragPreview";
import ShareButton from "./ShareButton";
import ConfirmDialog, { type DialogRequest } from "./ConfirmDialog";
import { buildShareLink } from "../share";

interface Props {
  boardId: string;
  onOpenCard: (card: CardData) => void;
}

export default function KanbanBoard({ boardId, onOpenCard }: Props) {
  const { state, dispatch } = useStore();
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColTitle, setNewColTitle] = useState("");
  const [dialog, setDialog] = useState<DialogRequest | null>(null);
  const [activeCard, setActiveCard] = useState<CardData | null>(null);

  const board = state.boards.find((b) => b.id === boardId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const columns = state.columns
    .filter((c) => c.boardId === boardId)
    .sort((a, b) => a.order - b.order);
  const cards = state.cards.filter((c) => c.boardId === boardId);

  function handleDragStart(event: DragStartEvent) {
    setActiveCard(cards.find((c) => c.id === event.active.id) ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveCard(null);
    const { active, over } = event;
    if (!over) return;
    const draggedCard = cards.find((c) => c.id === active.id);
    if (!draggedCard) return;

    const overId = String(over.id);
    let toColumnId: string;
    let toIndex: number;

    if (overId.startsWith("coldrop-")) {
      toColumnId = overId.replace("coldrop-", "");
      toIndex = cards.filter((c) => c.columnId === toColumnId && c.id !== draggedCard.id).length;
    } else {
      const overCard = cards.find((c) => c.id === overId);
      if (!overCard) return;
      toColumnId = overCard.columnId;
      const siblings = cards
        .filter((c) => c.columnId === toColumnId && c.id !== draggedCard.id)
        .sort((a, b) => a.order - b.order);
      toIndex = siblings.findIndex((c) => c.id === overCard.id);
      if (toIndex === -1) toIndex = siblings.length;
    }

    if (toColumnId === draggedCard.columnId && toIndex === draggedCard.order) return;
    dispatch({ type: "MOVE_CARD", cardId: draggedCard.id, toColumnId, toIndex });
  }

  function addColumn() {
    const t = newColTitle.trim();
    if (t) dispatch({ type: "ADD_COLUMN", boardId, title: t });
    setNewColTitle("");
    setAddingColumn(false);
  }

  function renameBoard() {
    if (!board) return;
    setDialog({
      title: "Renommer le tableau",
      mode: "prompt",
      defaultValue: board.name,
      confirmLabel: "Renommer",
      onConfirm: (value) => {
        if (value && value.trim()) dispatch({ type: "RENAME_BOARD", boardId, name: value.trim() });
      },
    });
  }

  function deleteBoard() {
    if (!board) return;
    if (state.boards.length <= 1) {
      setDialog({
        title: "Impossible de supprimer",
        message: "Il doit toujours rester au moins un tableau.",
        mode: "alert",
        onConfirm: () => {},
      });
      return;
    }
    setDialog({
      title: "Supprimer ce tableau ?",
      message: `« ${board.name} » et toutes ses étiquettes seront supprimés définitivement.`,
      mode: "confirm",
      confirmLabel: "Supprimer",
      danger: true,
      onConfirm: () => dispatch({ type: "DELETE_BOARD", boardId }),
    });
  }

  return (
    <>
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveCard(null)}
    >
      <div className="board-toolbar">
        {!board?.locked && (
          <>
            <button className="icon-text-btn" onClick={renameBoard}>
              ✎ Renommer le tableau
            </button>
            <button className="icon-text-btn" onClick={deleteBoard}>
              🗑 Supprimer le tableau
            </button>
          </>
        )}
        <ShareButton
          label="🔗 Partager ce tableau"
          buildLink={() => buildShareLink(board!.shareId!)}
        />
      </div>
      <div className="board-grid">
        {columns.map((col) => (
          <ColumnView
            key={col.id}
            column={col}
            cards={cards.filter((c) => c.columnId === col.id)}
            locked={!!board?.locked}
            onOpenCard={onOpenCard}
            onAddCard={(columnId, title) => dispatch({ type: "ADD_CARD", boardId, columnId, title })}
            onRenameColumn={(columnId, title) => dispatch({ type: "RENAME_COLUMN", columnId, title })}
            onDeleteColumn={(columnId) => dispatch({ type: "DELETE_COLUMN", columnId })}
          />
        ))}
        {!board?.locked && (
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
        )}
      </div>
      <DragOverlay>{activeCard && <CardDragPreview card={activeCard} />}</DragOverlay>
    </DndContext>
      {dialog && <ConfirmDialog request={dialog} onClose={() => setDialog(null)} />}
    </>
  );
}
