import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CardData } from "../types";
import { formatDate, isOverdue, isToday } from "../utils";

interface Props {
  card: CardData;
  onOpen: (card: CardData) => void;
}

export default function CardItem({ card, onOpen }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const overdue = isOverdue(card);
  const dueToday = isToday(card);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`sticky-card sticky-${card.color}`}
      onClick={() => onOpen(card)}
    >
      <div className="sticky-title">{card.title}</div>
      {card.assignees.length > 0 && (
        <div className="sticky-assignees">{card.assignees.join(" / ")}</div>
      )}
      {card.note && <div className="sticky-note">{card.note}</div>}
      <div className="sticky-meta">
        {card.dueDate && (
          <span className={`sticky-due ${overdue ? "overdue" : ""} ${dueToday ? "due-today" : ""}`}>
            {formatDate(card.dueDate)}
          </span>
        )}
        {card.priority === "urgente" && <span className="sticky-priority">🔥 urgent</span>}
        {card.log.length > 0 && <span className="sticky-log-count">📝 {card.log.length}</span>}
      </div>
    </div>
  );
}
