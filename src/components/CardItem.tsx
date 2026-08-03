import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CardData } from "../types";
import { useStore } from "../store";
import { formatDate, isOverdue, isToday, siteName } from "../utils";

interface Props {
  card: CardData;
  onOpen: (card: CardData) => void;
}

export default function CardItem({ card, onOpen }: Props) {
  const { state } = useStore();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  });

  const baseTransform = CSS.Transform.toString(transform);
  const style: React.CSSProperties = {
    transform: isDragging
      ? `${baseTransform ?? ""} scale(1.06) rotate(2deg)`.trim()
      : baseTransform,
    transition,
    opacity: isDragging ? 0.95 : 1,
    zIndex: isDragging ? 20 : undefined,
  };

  const overdue = isOverdue(card);
  const dueToday = isToday(card);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`sticky-card sticky-${card.color} ${isDragging ? "is-dragging" : ""}`}
      onClick={() => onOpen(card)}
    >
      <div className="sticky-title">{card.title}</div>
      {siteName(state, card) && <div className="sticky-site">📍 {siteName(state, card)}</div>}
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
