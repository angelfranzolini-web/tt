import { useState } from "react";
import type { CardData } from "../types";
import { useStore } from "../store";
import { boardName, columnTitle, formatDate, isOverdue, isToday, siteName } from "../utils";

interface Props {
  onOpenCard: (card: CardData) => void;
}

const UNASSIGNED = "Non assigné";

type DueFilter = "all" | "today" | "overdue" | "none";
type PriorityFilter = "all" | NonNullable<CardData["priority"]>;

export default function PersonView({ onOpenCard }: Props) {
  const { state } = useStore();
  const [personSearch, setPersonSearch] = useState("");
  const [dueFilter, setDueFilter] = useState<DueFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [siteFilter, setSiteFilter] = useState<string>("all");
  const [boardFilter, setBoardFilter] = useState<string>("all");

  const filteredCards = state.cards.filter((card) => {
    if (dueFilter === "today" && !isToday(card)) return false;
    if (dueFilter === "overdue" && !isOverdue(card)) return false;
    if (dueFilter === "none" && card.dueDate) return false;
    if (priorityFilter !== "all" && card.priority !== priorityFilter) return false;
    if (siteFilter !== "all" && card.siteId !== siteFilter) return false;
    if (boardFilter !== "all" && card.boardId !== boardFilter) return false;
    return true;
  });

  const groups = new Map<string, CardData[]>();
  for (const card of filteredCards) {
    const people = card.assignees.length > 0 ? card.assignees : [UNASSIGNED];
    for (const person of people) {
      if (!groups.has(person)) groups.set(person, []);
      groups.get(person)!.push(card);
    }
  }

  const search = personSearch.trim().toLowerCase();
  const entries = [...groups.entries()]
    .filter(([person]) => !search || person.toLowerCase().includes(search))
    .sort((a, b) => {
      if (a[0] === UNASSIGNED) return 1;
      if (b[0] === UNASSIGNED) return -1;
      return a[0].localeCompare(b[0]);
    });

  const activeFilterCount = [
    personSearch.trim() !== "",
    dueFilter !== "all",
    priorityFilter !== "all",
    siteFilter !== "all",
    boardFilter !== "all",
  ].filter(Boolean).length;

  function resetFilters() {
    setPersonSearch("");
    setDueFilter("all");
    setPriorityFilter("all");
    setSiteFilter("all");
    setBoardFilter("all");
  }

  return (
    <div className="agg-view">
      <div className="agg-intro">
        <h2>Suivi par personne</h2>
        <p>Ce que chaque personne a en mission actuellement, tous tableaux et tous sites confondus.</p>
      </div>

      <div className="filter-bar">
        <input
          className="filter-search"
          value={personSearch}
          onChange={(e) => setPersonSearch(e.target.value)}
          placeholder="Rechercher une personne…"
        />
        <button
          className={`filter-chip ${dueFilter === "today" ? "active" : ""}`}
          onClick={() => setDueFilter(dueFilter === "today" ? "all" : "today")}
        >
          ☀️ Aujourd'hui
        </button>
        <button
          className={`filter-chip ${dueFilter === "overdue" ? "active" : ""}`}
          onClick={() => setDueFilter(dueFilter === "overdue" ? "all" : "overdue")}
        >
          🔴 En retard
        </button>
        <select value={dueFilter} onChange={(e) => setDueFilter(e.target.value as DueFilter)}>
          <option value="all">Toutes les échéances</option>
          <option value="today">Échéance aujourd'hui</option>
          <option value="overdue">En retard</option>
          <option value="none">Sans échéance</option>
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}>
          <option value="all">Toutes priorités</option>
          <option value="faible">🟢 Faible</option>
          <option value="moyenne">🟡 Moyenne</option>
          <option value="urgente">🔴 Urgente</option>
        </select>
        <select value={siteFilter} onChange={(e) => setSiteFilter(e.target.value)}>
          <option value="all">Tous les sites</option>
          {[...state.sites]
            .sort((a, b) => a.name.localeCompare(b.name, "fr"))
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
        </select>
        <select value={boardFilter} onChange={(e) => setBoardFilter(e.target.value)}>
          <option value="all">Tous les tableaux</option>
          {state.boards.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        {activeFilterCount > 0 && (
          <button className="filter-clear" onClick={resetFilters}>
            ✕ Réinitialiser ({activeFilterCount})
          </button>
        )}
      </div>

      {entries.length === 0 && <p className="agg-empty-state">Aucun résultat pour ces filtres.</p>}

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
                {siteName(state, card) && <div className="agg-card-people">📍 {siteName(state, card)}</div>}
                {card.dueDate && (
                  <div className={`agg-card-due ${isOverdue(card) ? "overdue" : ""} ${isToday(card) ? "due-today" : ""}`}>
                    📅 {formatDate(card.dueDate)}
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
