import { useState } from "react";
import type { CardData } from "../types";
import { useStore } from "../store";
import { ARCHIVE_BOARD_ID } from "../shared/reducer";
import { formatDateTime, siteName } from "../utils";

interface Props {
  onOpenCard: (card: CardData) => void;
}

export default function ArchiveView({ onOpenCard }: Props) {
  const { state } = useStore();
  const [search, setSearch] = useState("");
  const [siteFilter, setSiteFilter] = useState("all");
  const [personFilter, setPersonFilter] = useState("all");

  const archived = state.cards.filter((c) => c.boardId === ARCHIVE_BOARD_ID);

  const people = [...new Set(archived.flatMap((c) => c.assignees))].sort((a, b) => a.localeCompare(b, "fr"));
  const sites = [...state.sites].sort((a, b) => a.name.localeCompare(b.name, "fr"));

  const needle = search.trim().toLowerCase();
  const filtered = archived
    .filter((c) => !needle || c.title.toLowerCase().includes(needle))
    .filter((c) => siteFilter === "all" || c.siteId === siteFilter)
    .filter((c) => personFilter === "all" || c.assignees.includes(personFilter))
    .sort((a, b) => (b.archivedAt ?? "").localeCompare(a.archivedAt ?? ""));

  const activeFilterCount = [search.trim() !== "", siteFilter !== "all", personFilter !== "all"].filter(
    Boolean
  ).length;

  function resetFilters() {
    setSearch("");
    setSiteFilter("all");
    setPersonFilter("all");
  }

  return (
    <div className="agg-view">
      <div className="agg-intro">
        <h2>Archives</h2>
        <p>
          Les tickets marqués « Fait » dans « À faire aujourd'hui » arrivent ici automatiquement au
          bout d'une journée, pour en garder une trace permanente. On ne peut rien créer ici
          directement.
        </p>
      </div>

      <div className="filter-bar">
        <input
          className="filter-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un ticket…"
        />
        <select value={siteFilter} onChange={(e) => setSiteFilter(e.target.value)}>
          <option value="all">Tous les sites</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select value={personFilter} onChange={(e) => setPersonFilter(e.target.value)}>
          <option value="all">Toutes les personnes</option>
          {people.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        {activeFilterCount > 0 && (
          <button className="filter-clear" onClick={resetFilters}>
            ✕ Réinitialiser ({activeFilterCount})
          </button>
        )}
      </div>

      {filtered.length === 0 && <p className="agg-empty-state">Aucun résultat pour ces filtres.</p>}

      {filtered.length > 0 && (
        <div className="agg-cards">
          {filtered.map((card) => (
            <button key={card.id} className={`agg-card sticky-${card.color}`} onClick={() => onOpenCard(card)}>
              <div className="agg-card-title">{card.title}</div>
              {card.archivedFrom && <div className="agg-card-sub">Depuis {card.archivedFrom}</div>}
              {siteName(state, card) && <div className="agg-card-people">📍 {siteName(state, card)}</div>}
              {card.assignees.length > 0 && <div className="agg-card-people">👤 {card.assignees.join(", ")}</div>}
              {card.archivedAt && <div className="agg-card-due">🗄️ Archivé le {formatDateTime(card.archivedAt)}</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
