import { useState } from "react";
import type { CardData } from "../types";
import { CARD_COLORS, PRIORITY_COLOR } from "../types";
import { useStore } from "../store";
import { detectSiteId, formatDateTime } from "../utils";

interface Props {
  card: CardData;
  onClose: () => void;
}

export default function CardModal({ card, onClose }: Props) {
  const { state, dispatch } = useStore();
  const [assigneeInput, setAssigneeInput] = useState("");
  const [logAuthor, setLogAuthor] = useState("");
  const [logText, setLogText] = useState("");

  const columns = state.columns
    .filter((c) => c.boardId === card.boardId)
    .sort((a, b) => a.order - b.order);
  const sites = [...state.sites].sort((a, b) => a.name.localeCompare(b.name, "fr"));

  function patch(fields: Partial<CardData>) {
    dispatch({ type: "UPDATE_CARD", cardId: card.id, patch: fields });
  }

  function handleTitleChange(title: string) {
    const autoSiteId = card.siteId ? undefined : detectSiteId(title, state.sites);
    patch(autoSiteId ? { title, siteId: autoSiteId } : { title });
  }

  function addAssignee() {
    const name = assigneeInput.trim();
    if (!name) return;
    patch({ assignees: [...card.assignees, name] });
    setAssigneeInput("");
  }

  function removeAssignee(name: string) {
    patch({ assignees: card.assignees.filter((a) => a !== name) });
  }

  function addLog() {
    const text = logText.trim();
    if (!text) return;
    dispatch({
      type: "ADD_LOG",
      cardId: card.id,
      entry: {
        id: `log-${Date.now()}`,
        date: new Date().toISOString(),
        author: logAuthor.trim() || "Anonyme",
        text,
      },
    });
    setLogText("");
  }

  function handleDelete() {
    if (confirm(`Supprimer l'étiquette « ${card.title} » ?`)) {
      dispatch({ type: "DELETE_CARD", cardId: card.id });
      onClose();
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <input
            className="modal-title-input"
            value={card.title}
            onChange={(e) => handleTitleChange(e.target.value)}
          />
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-row">
            <label>Couleur</label>
            <div className="color-picker">
              {CARD_COLORS.map((c) => (
                <button
                  key={c.value}
                  className={`color-dot color-${c.value} ${card.color === c.value ? "selected" : ""}`}
                  title={c.label}
                  onClick={() => patch({ color: c.value })}
                />
              ))}
            </div>
          </div>

          <div className="modal-row">
            <label>Compartiment</label>
            <select
              value={card.columnId}
              onChange={(e) => patch({ columnId: e.target.value })}
            >
              {columns.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.title}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-row">
            <label>Site / zone</label>
            <select
              value={card.siteId ?? ""}
              onChange={(e) => patch({ siteId: e.target.value || undefined })}
            >
              <option value="">— Aucun site (ticket interne) —</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <span className="field-hint">
              Les sites se créent depuis la Vue par site. Un titre qui mentionne un site existant
              l'assigne automatiquement.
            </span>
          </div>

          <div className="modal-row">
            <label>Personnes assignées</label>
            <div className="assignee-list">
              {card.assignees.map((a) => (
                <span key={a} className="assignee-chip">
                  {a}
                  <button onClick={() => removeAssignee(a)}>✕</button>
                </span>
              ))}
            </div>
            <div className="inline-add">
              <input
                value={assigneeInput}
                placeholder="Ajouter une personne…"
                onChange={(e) => setAssigneeInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addAssignee()}
              />
              <button onClick={addAssignee}>Ajouter</button>
            </div>
          </div>

          <div className="modal-row two-col">
            <div>
              <label>Échéance</label>
              <input
                type="date"
                value={card.dueDate ?? ""}
                onChange={(e) => patch({ dueDate: e.target.value || undefined })}
              />
            </div>
            <div>
              <label>Priorité</label>
              <select
                value={card.priority ?? "faible"}
                onChange={(e) => {
                  const priority = e.target.value as NonNullable<CardData["priority"]>;
                  patch({ priority, color: PRIORITY_COLOR[priority] });
                }}
              >
                <option value="faible">Faible (vert)</option>
                <option value="moyenne">Moyenne (jaune)</option>
                <option value="urgente">Urgente (rouge)</option>
              </select>
              <span className="field-hint">
                Change aussi la couleur — le bleu (maintenance) et l'orange (autre) se choisissent manuellement
                ci-dessus.
              </span>
            </div>
          </div>

          <div className="modal-row">
            <label>Note rapide</label>
            <input
              value={card.note ?? ""}
              placeholder="ex. Suivi si n° de dalle"
              onChange={(e) => patch({ note: e.target.value || undefined })}
            />
          </div>

          <div className="modal-row">
            <label>Description</label>
            <textarea
              rows={3}
              value={card.description ?? ""}
              onChange={(e) => patch({ description: e.target.value || undefined })}
              placeholder="Détails du dossier…"
            />
          </div>

          <div className="modal-row">
            <label>Journal de suivi (avancement)</label>
            <div className="log-list">
              {card.log.length === 0 && <div className="log-empty">Aucune entrée pour le moment.</div>}
              {[...card.log]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((entry) => (
                  <div key={entry.id} className="log-entry">
                    <div className="log-entry-head">
                      <strong>{entry.author}</strong>
                      <span>{formatDateTime(entry.date)}</span>
                    </div>
                    <div className="log-entry-text">{entry.text}</div>
                  </div>
                ))}
            </div>
            <div className="log-add">
              <input
                value={logAuthor}
                placeholder="Votre nom"
                className="log-author-input"
                onChange={(e) => setLogAuthor(e.target.value)}
              />
              <textarea
                rows={2}
                value={logText}
                placeholder="Ajouter une mise à jour sur l'avancement…"
                onChange={(e) => setLogText(e.target.value)}
              />
              <button onClick={addLog}>Publier la mise à jour</button>
            </div>
          </div>

          <div className="modal-row">
            <button className="danger" onClick={handleDelete}>
              Supprimer cette étiquette
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
