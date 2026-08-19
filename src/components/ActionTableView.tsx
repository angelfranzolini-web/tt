import { useEffect, useRef, useState } from "react";
import type { CardData } from "../types";
import { ACTION_STATUSES } from "../types";
import { useStore } from "../store";
import ShareButton from "./ShareButton";
import ConfirmDialog, { type DialogRequest } from "./ConfirmDialog";
import { buildShareLink } from "../share";
import { isOverdue, isToday } from "../utils";

interface Props {
  boardId: string;
}

type DueFilter = "all" | "today" | "overdue" | "none";

function AutoTextarea({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function resize() {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  useEffect(resize, [value]);

  return (
    <textarea
      ref={ref}
      className="action-textarea"
      rows={1}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function ActionRow({ card, onDelete }: { card: CardData; onDelete: () => void }) {
  const { dispatch } = useStore();
  const [quiDraft, setQuiDraft] = useState(card.assignees.join(", "));

  function patch(fields: Partial<CardData>) {
    dispatch({ type: "UPDATE_CARD", cardId: card.id, patch: fields });
  }

  function commitQui() {
    const names = quiDraft
      .split(/[,/]/)
      .map((n) => n.trim())
      .filter(Boolean);
    patch({ assignees: names });
  }

  return (
    <tr>
      <td>
        <input value={card.theme ?? ""} placeholder="Thème" onChange={(e) => patch({ theme: e.target.value })} />
      </td>
      <td>
        <AutoTextarea value={card.title} placeholder="Action" onChange={(title) => patch({ title })} />
      </td>
      <td>
        <input
          value={quiDraft}
          placeholder="Qui"
          onChange={(e) => setQuiDraft(e.target.value)}
          onBlur={commitQui}
          onKeyDown={(e) => e.key === "Enter" && commitQui()}
        />
      </td>
      <td>
        <input
          type="date"
          value={card.dueDate ?? ""}
          onChange={(e) => patch({ dueDate: e.target.value || undefined })}
        />
      </td>
      <td>
        <select
          className={`action-status action-status-${card.status ?? "a_faire"}`}
          value={card.status ?? "a_faire"}
          onChange={(e) => patch({ status: e.target.value as CardData["status"] })}
        >
          {ACTION_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </td>
      <td className="action-row-delete">
        <button className="column-icon-btn" title="Supprimer cette ligne" onClick={onDelete}>
          🗑
        </button>
      </td>
    </tr>
  );
}

export default function ActionTableView({ boardId }: Props) {
  const { state, dispatch } = useStore();
  const [dialog, setDialog] = useState<DialogRequest | null>(null);
  const [themeFilter, setThemeFilter] = useState("all");
  const [actionSearch, setActionSearch] = useState("");
  const [quiFilter, setQuiFilter] = useState("all");
  const [dueFilter, setDueFilter] = useState<DueFilter>("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const board = state.boards.find((b) => b.id === boardId);
  const column = state.columns.find((c) => c.boardId === boardId);
  const allRows = state.cards.filter((c) => c.boardId === boardId).sort((a, b) => a.order - b.order);

  const themes = [...new Set(allRows.map((c) => c.theme).filter((t): t is string => !!t))].sort((a, b) =>
    a.localeCompare(b, "fr")
  );
  const people = [...new Set(allRows.flatMap((c) => c.assignees))].sort((a, b) => a.localeCompare(b, "fr"));

  const search = actionSearch.trim().toLowerCase();
  const rows = allRows.filter((card) => {
    if (themeFilter !== "all" && card.theme !== themeFilter) return false;
    if (search && !card.title.toLowerCase().includes(search)) return false;
    if (quiFilter !== "all" && !card.assignees.includes(quiFilter)) return false;
    if (dueFilter === "today" && !isToday(card)) return false;
    if (dueFilter === "overdue" && !isOverdue(card)) return false;
    if (dueFilter === "none" && card.dueDate) return false;
    if (statusFilter !== "all" && (card.status ?? "a_faire") !== statusFilter) return false;
    return true;
  });

  const activeFilterCount = [
    themeFilter !== "all",
    actionSearch.trim() !== "",
    quiFilter !== "all",
    dueFilter !== "all",
    statusFilter !== "all",
  ].filter(Boolean).length;

  function resetFilters() {
    setThemeFilter("all");
    setActionSearch("");
    setQuiFilter("all");
    setDueFilter("all");
    setStatusFilter("all");
  }

  function addRow() {
    if (!column) return;
    dispatch({ type: "ADD_CARD", boardId, columnId: column.id, title: "Nouvelle action" });
  }

  function deleteRow(card: CardData) {
    setDialog({
      title: "Supprimer cette ligne ?",
      message: card.title ? `« ${card.title} » sera supprimée définitivement.` : undefined,
      mode: "confirm",
      confirmLabel: "Supprimer",
      danger: true,
      onConfirm: () => dispatch({ type: "DELETE_CARD", cardId: card.id }),
    });
  }

  return (
    <div className="action-table-view">
      <div className="board-toolbar">
        <ShareButton
          label="🔗 Partager ce tableau"
          buildLink={() => buildShareLink(board!.shareId!)}
        />
      </div>
      <div className="filter-bar">
        <select value={themeFilter} onChange={(e) => setThemeFilter(e.target.value)}>
          <option value="all">Tous les thèmes</option>
          {themes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          className="filter-search"
          value={actionSearch}
          onChange={(e) => setActionSearch(e.target.value)}
          placeholder="Rechercher une action…"
        />
        <select value={quiFilter} onChange={(e) => setQuiFilter(e.target.value)}>
          <option value="all">Toutes les personnes</option>
          {people.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select value={dueFilter} onChange={(e) => setDueFilter(e.target.value as DueFilter)}>
          <option value="all">Toutes les échéances</option>
          <option value="today">Début aujourd'hui</option>
          <option value="overdue">En retard</option>
          <option value="none">Sans date</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Tous les statuts</option>
          {ACTION_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        {activeFilterCount > 0 && (
          <button className="filter-clear" onClick={resetFilters}>
            ✕ Réinitialiser ({activeFilterCount})
          </button>
        )}
      </div>
      <div className="action-table-wrap">
        <table className="action-table">
          <thead>
            <tr>
              <th>Thème</th>
              <th>Action</th>
              <th>Qui</th>
              <th>Début</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((card) => (
              <ActionRow key={card.id} card={card} onDelete={() => deleteRow(card)} />
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="agg-empty-state">
            {allRows.length === 0 ? "Aucune ligne pour le moment." : "Aucun résultat pour ces filtres."}
          </p>
        )}
        <button className="add-card-trigger action-add-row" onClick={addRow}>
          + Ajouter une ligne
        </button>
      </div>
      {dialog && <ConfirmDialog request={dialog} onClose={() => setDialog(null)} />}
    </div>
  );
}
