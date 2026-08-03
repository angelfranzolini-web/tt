import type { CardData } from "../types";
import { CardContent } from "./CardItem";

export default function CardDragPreview({ card }: { card: CardData }) {
  return (
    <div className={`sticky-card sticky-${card.color} sticky-drag-preview`}>
      <CardContent card={card} />
    </div>
  );
}
