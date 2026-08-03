import { useEffect, useRef, useState } from "react";
import type { CardData } from "../types";
import { useStore } from "../store";
import ShareButton from "./ShareButton";
import ConfirmDialog, { type DialogRequest } from "./ConfirmDialog";
import { buildShareLink } from "../share";

interface Props {
  boardId: string;
}

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

  const board = state.boards.find((b) => b.id === boardId);
  const column = state.columns.find((c) => c.boardId === boardId);
  const rows = state.cards.filter((c) => c.boardId === boardId).sort((a, b) => a.order - b.order);

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
      <div className="action-table-wrap">
        <table className="action-table">
          <thead>
            <tr>
              <th>Thème</th>
              <th>Action</th>
              <th>Qui</th>
              <th>Début</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((card) => (
              <ActionRow key={card.id} card={card} onDelete={() => deleteRow(card)} />
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="agg-empty-state">Aucune ligne pour le moment.</p>}
        <button className="add-card-trigger action-add-row" onClick={addRow}>
          + Ajouter une ligne
        </button>
      </div>
      {dialog && <ConfirmDialog request={dialog} onClose={() => setDialog(null)} />}
    </div>
  );
}
