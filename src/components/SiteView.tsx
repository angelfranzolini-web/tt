import type { CardData } from "../types";
import { useStore } from "../store";
import { boardName, columnTitle, displaySite, formatDate, formatDateTime } from "../utils";

interface Props {
  onOpenCard: (card: CardData) => void;
}

export default function SiteView({ onOpenCard }: Props) {
  const { state } = useStore();

  const groups = new Map<string, CardData[]>();
  for (const card of state.cards) {
    const key = displaySite(card);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(card);
  }

  const entries = [...groups.entries()].sort((a, b) => {
    if (a[0] === "Sacré-Cœur") return -1;
    if (b[0] === "Sacré-Cœur") return 1;
    return b[1].length - a[1].length;
  });

  return (
    <div className="agg-view">
      <div className="agg-intro">
        <h2>Suivi par site / zone</h2>
        <p>
          Vue centralisée demandée par Nikolas Besner : pour chaque site, qui travaille sur quoi, dans
          quel compartiment, et le dernier point d'avancement — tous tableaux confondus.
        </p>
      </div>
      {entries.map(([site, cards]) => (
        <div key={site} className={`agg-group ${site === "Sacré-Cœur" ? "agg-group-highlight" : ""}`}>
          <div className="agg-group-header">
            <h3>{site}</h3>
            <span className="agg-group-count">{cards.length} élément(s)</span>
          </div>
          {site === "Sacré-Cœur" && (
            <div className="agg-callout">
              📩 Demande initiale de Nikolas Besner : « avoir une bonne visibilité sur qui travaille sur
              quoi et l'avancement des différents éléments ».
            </div>
          )}
          <div className="agg-cards">
            {cards.map((card) => (
              <button key={card.id} className={`agg-card sticky-${card.color}`} onClick={() => onOpenCard(card)}>
                <div className="agg-card-title">{card.title}</div>
                <div className="agg-card-sub">
                  {boardName(state, card.boardId)} · {columnTitle(state, card.columnId)}
                </div>
                {card.assignees.length > 0 && (
                  <div className="agg-card-people">👤 {card.assignees.join(", ")}</div>
                )}
                {card.dueDate && <div className="agg-card-due">📅 {formatDate(card.dueDate)}</div>}
                {card.log.length > 0 && (
                  <div className="agg-card-last-log">
                    Dernière mise à jour ({formatDateTime(card.log[card.log.length - 1].date)}) :{" "}
                    {card.log[card.log.length - 1].text}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
