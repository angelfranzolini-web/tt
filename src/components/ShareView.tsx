import type { SharePayload } from "../share";

interface Props {
  payload: SharePayload;
}

function formatDate(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function ShareView({ payload }: Props) {
  return (
    <div className="share-view">
      <header className="share-view-header">
        <h1>📍 {payload.name}</h1>
        <p>
          Vue partagée en lecture seule — {payload.kind === "site" ? "toutes les missions de ce site" : "ce tableau"}
          , tous les autres tableaux et sites restent privés.
        </p>
        <p className="share-view-generated">
          Généré le {formatDateTime(payload.generatedAt)}. Ce lien ne périme pas mais reste figé à cet instant :
          demandez un lien à jour si besoin.
        </p>
      </header>

      <div className="share-cards">
        {payload.cards.length === 0 && <p className="share-empty">Aucun élément à afficher pour le moment.</p>}
        {payload.cards.map((card, i) => (
          <div key={i} className={`share-card sticky-${card.color}`}>
            <div className="share-card-title">{card.title}</div>
            <div className="share-card-status">{card.statusLabel}</div>
            {card.assignees.length > 0 && <div className="share-card-people">👤 {card.assignees.join(", ")}</div>}
            {card.note && <div className="share-card-note">{card.note}</div>}
            {card.dueDate && <div className="share-card-due">📅 {formatDate(card.dueDate)}</div>}
            {card.description && <div className="share-card-desc">{card.description}</div>}
            {card.log.length > 0 && (
              <div className="share-card-log">
                <div className="share-card-log-title">Avancement</div>
                {[...card.log]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((entry, j) => (
                    <div key={j} className="share-log-entry">
                      <strong>{entry.author}</strong> · {formatDateTime(entry.date)}
                      <div>{entry.text}</div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
