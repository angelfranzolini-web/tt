import type { CardData } from "../types";
import { useStore } from "../store";
import { boardName, columnTitle, displaySite, formatDate, formatDateTime, siteKey } from "../utils";
import ShareButton from "./ShareButton";
import { buildShareLink, buildSitePayload } from "../share";

interface Props {
  onOpenCard: (card: CardData) => void;
}

interface SiteGroup {
  key: string;
  label: string;
  cards: CardData[];
}

export default function SiteView({ onOpenCard }: Props) {
  const { state } = useStore();

  // Cards are grouped by a normalized key (accents/case/hyphens ignored) so
  // "Sacré-Cœur", "sacré coeur" etc. entered on different boards all land in
  // the same group. The group is labeled with whichever raw spelling was
  // used most often.
  const groups = new Map<string, { label: string; cards: CardData[]; labelCounts: Map<string, number> }>();
  for (const card of state.cards) {
    const raw = displaySite(card);
    const key = siteKey(raw);
    if (!groups.has(key)) groups.set(key, { label: raw, cards: [], labelCounts: new Map() });
    const group = groups.get(key)!;
    group.cards.push(card);
    group.labelCounts.set(raw, (group.labelCounts.get(raw) ?? 0) + 1);
    let bestLabel = group.label;
    let bestCount = 0;
    for (const [candidate, count] of group.labelCounts) {
      if (count > bestCount) {
        bestCount = count;
        bestLabel = candidate;
      }
    }
    group.label = bestLabel;
  }

  const entries: SiteGroup[] = [...groups.entries()]
    .map(([key, g]) => ({ key, label: g.label, cards: g.cards }))
    .sort((a, b) => b.cards.length - a.cards.length);

  return (
    <div className="agg-view">
      <div className="agg-intro">
        <h2>Suivi par site / zone</h2>
        <p>
          Pour chaque site, qui travaille sur quoi, dans quel compartiment, et le dernier point
          d'avancement — tous tableaux confondus. Utilisez « Partager » pour donner à une personne
          externe un lien qui ne montre que ce site, sans accès au reste du suivi.
        </p>
      </div>
      {entries.map(({ key, label, cards }) => (
        <div key={key} className="agg-group">
          <div className="agg-group-header">
            <h3>{label}</h3>
            <div className="agg-group-header-actions">
              <span className="agg-group-count">{cards.length} élément(s)</span>
              <ShareButton buildLink={() => buildShareLink(buildSitePayload(state, label))} />
            </div>
          </div>
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
