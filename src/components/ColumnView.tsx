import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { CardData, ColumnData } from "../types";
import CardItem from "./CardItem";

interface Props {
  column: ColumnData;
  cards: CardData[];
  onOpenCard: (card: CardData) => void;
  onAddCard: (columnId: string, title: string) => void;
}

export default function ColumnView({ column, cards, onOpenCard, onAddCard }: Props) {
  const { setNodeRef } = useDroppable({ id: `coldrop-${column.id}` });
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");

  const sorted = [...cards].sort((a, b) => a.order - b.order);

  function submitAdd() {
    const t = title.trim();
    if (t) onAddCard(column.id, t);
    setTitle("");
    setAdding(false);
  }

  return (
    <div className="board-column">
      <div className="board-column-header">
        <span>{column.title}</span>
        <span className="board-column-count">{sorted.length}</span>
      </div>
      <div className="board-column-body" ref={setNodeRef}>
        <SortableContext items={sorted.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {sorted.map((card) => (
            <CardItem key={card.id} card={card} onOpen={onOpenCard} />
          ))}
        </SortableContext>
        {adding ? (
          <div className="add-card-form">
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitAdd();
                if (e.key === "Escape") {
                  setAdding(false);
                  setTitle("");
                }
              }}
              placeholder="Titre de l'étiquette…"
            />
            <div className="add-card-actions">
              <button onClick={submitAdd}>Ajouter</button>
              <button
                className="ghost"
                onClick={() => {
                  setAdding(false);
                  setTitle("");
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <button className="add-card-trigger" onClick={() => setAdding(true)}>
            + Ajouter une étiquette
          </button>
        )}
      </div>
    </div>
  );
}
