import { useState } from "react";
import type { CardData } from "../types";
import { useStore } from "../store";
import { boardName, columnTitle, formatDate, formatDateTime } from "../utils";
import ShareButton from "./ShareButton";
import ConfirmDialog, { type DialogRequest } from "./ConfirmDialog";
import { buildShareLink } from "../share";

interface Props {
  onOpenCard: (card: CardData) => void;
}

function AddSiteForm() {
  const { dispatch } = useStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  function submit() {
    const n = name.trim();
    if (!n) return;
    dispatch({ type: "ADD_SITE", name: n });
    setName("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button className="nav-btn nav-btn-add" onClick={() => setOpen(true)}>
        + Nouveau site
      </button>
    );
  }

  return (
    <div className="add-board-form">
      <input
        autoFocus
        placeholder="Nom du site (ex. Sacré-Cœur)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") setOpen(false);
        }}
      />
      <button onClick={submit}>Créer</button>
      <button className="ghost" onClick={() => setOpen(false)}>
        Annuler
      </button>
    </div>
  );
}

function AddSiteTicketForm({ siteId }: { siteId: string }) {
  const { state, dispatch } = useStore();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [boardId, setBoardId] = useState(state.boards[0]?.id ?? "");

  const columnsForBoard = state.columns
    .filter((c) => c.boardId === boardId)
    .sort((a, b) => a.order - b.order);
  const [columnId, setColumnId] = useState(columnsForBoard[0]?.id ?? "");

  function handleBoardChange(nextBoardId: string) {
    setBoardId(nextBoardId);
    const firstCol = state.columns
      .filter((c) => c.boardId === nextBoardId)
      .sort((a, b) => a.order - b.order)[0];
    setColumnId(firstCol?.id ?? "");
  }

  function submit() {
    const t = title.trim();
    if (!t || !boardId || !columnId) return;
    dispatch({ type: "ADD_CARD", boardId, columnId, title: t, siteId });
    setTitle("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button className="add-card-trigger site-add-ticket-trigger" onClick={() => setOpen(true)}>
        + Ajouter un ticket à ce site
      </button>
    );
  }

  return (
    <div className="add-card-form site-add-ticket-form">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titre du ticket…"
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
      />
      <div className="site-add-ticket-selects">
        <select value={boardId} onChange={(e) => handleBoardChange(e.target.value)}>
          {state.boards.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <select value={columnId} onChange={(e) => setColumnId(e.target.value)}>
          {columnsForBoard.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>
      <div className="add-card-actions">
        <button onClick={submit}>Ajouter</button>
        <button className="ghost" onClick={() => setOpen(false)}>
          Annuler
        </button>
      </div>
    </div>
  );
}

export default function SiteView({ onOpenCard }: Props) {
  const { state, dispatch } = useStore();

  const [dialog, setDialog] = useState<DialogRequest | null>(null);

  const sites = [...state.sites].sort((a, b) => a.name.localeCompare(b.name, "fr"));

  function renameSite(siteId: string, current: string) {
    setDialog({
      title: "Renommer le site",
      mode: "prompt",
      defaultValue: current,
      confirmLabel: "Renommer",
      onConfirm: (value) => {
        if (value && value.trim()) dispatch({ type: "RENAME_SITE", siteId, name: value.trim() });
      },
    });
  }

  function deleteSite(siteId: string, name: string, ticketCount: number) {
    setDialog({
      title: `Supprimer le site « ${name} » ?`,
      message:
        ticketCount > 0
          ? `Ses ${ticketCount} ticket(s) ne seront pas supprimés, juste retirés de ce site.`
          : undefined,
      mode: "confirm",
      confirmLabel: "Supprimer",
      danger: true,
      onConfirm: () => dispatch({ type: "DELETE_SITE", siteId }),
    });
  }

  return (
    <div className="agg-view">
      <div className="agg-intro">
        <h2>Suivi par site / zone</h2>
        <p>
          Les sites sont les établissements clients — créez-les explicitement. Un ticket créé sur
          n'importe quel tableau rejoint automatiquement son site si le titre le mentionne, ou vous
          pouvez l'assigner à la main dans sa fiche. Les tickets internes (sans site) n'apparaissent pas
          ici. Utilisez « Partager » pour donner à une personne externe un lien qui ne montre que ce
          site.
        </p>
        <AddSiteForm />
      </div>

      {sites.length === 0 && (
        <p className="agg-empty-state">Aucun site créé pour le moment. Cliquez sur « + Nouveau site ».</p>
      )}

      {sites.map((site) => {
        const cards = state.cards.filter((c) => c.siteId === site.id);
        return (
          <div key={site.id} className="agg-group">
            <div className="agg-group-header">
              <h3>{site.name}</h3>
              <div className="agg-group-header-actions">
                <span className="agg-group-count">{cards.length} élément(s)</span>
                <button className="column-icon-btn" title="Renommer" onClick={() => renameSite(site.id, site.name)}>
                  ✎
                </button>
                <button
                  className="column-icon-btn"
                  title="Supprimer"
                  onClick={() => deleteSite(site.id, site.name, cards.length)}
                >
                  🗑
                </button>
                <ShareButton buildLink={() => buildShareLink(site.shareId!)} />
              </div>
            </div>
            {cards.length > 0 && (
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
            )}
            <AddSiteTicketForm siteId={site.id} />
          </div>
        );
      })}
      {dialog && <ConfirmDialog request={dialog} onClose={() => setDialog(null)} />}
    </div>
  );
}
