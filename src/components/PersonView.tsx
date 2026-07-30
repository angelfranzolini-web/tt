import type { CardData } from "../types";
import { useStore } from "../store";
import { boardName, columnTitle, displaySite, formatDate } from "../utils";

interface Props {
  onOpenCard: (card: CardData) => void;
}

const UNASSIGNED = "Non assigné";

export default function PersonView({ onOpenCard }: Props) {
  const { state } = useStore();

  const groups = new Map<string, CardData[]>();
  for (const card of state.cards) {
    const people = card.assignees.length > 0 ? card.assignees : [UNASSIGNED];
    for (const person of people) {
      if (!groups.has(person)) groups.set(person, []);
      groups.get(person)!.push(card);
    }
  }

  const entries = [...groups.entries()].sort((a, b) => {
    if (a[0] === UNASSIGNED) return 1;
    if (b[0] === UNASSIGNED) return -1;
    return a[0].localeCompare(b[0]);
  });

  return (
    <div className="agg-view">
      <div className="agg-intro">
        <h2>Suivi par personne</h2>
        <p>Ce que chaque personne a en mission actuellement, tous tableaux et tous sites confondus.</p>
      </div>
      {entries.map(([person, cards]) => (
        <div key={person} className="agg-group">
          <div className="agg-group-header">
            <h3>{person === UNASSIGNED ? "🕳️ " + UNASSIGNED : "👤 " + person}</h3>
            <span className="agg-group-count">{cards.length} mission(s)</span>
          </div>
          <div className="agg-cards">
            {cards.map((card) => (
              <button key={card.id} className={`agg-card sticky-${card.color}`} onClick={() => onOpenCard(card)}>
                <div className="agg-card-title">{card.title}</div>
                <div className="agg-card-sub">
                  {boardName(state, card.boardId)} · {columnTitle(state, card.columnId)}
                </div>
                <div className="agg-card-people">📍 {displaySite(card)}</div>
                {card.dueDate && <div className="agg-card-due">📅 {formatDate(card.dueDate)}</div>}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
