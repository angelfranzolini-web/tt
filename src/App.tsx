import { useState } from "react";
import { StoreProvider, useStore } from "./store";
import KanbanBoard from "./components/KanbanBoard";
import CardModal from "./components/CardModal";
import SiteView from "./components/SiteView";
import PersonView from "./components/PersonView";
import type { CardData } from "./types";
import "./App.css";

type ViewMode = { type: "board"; boardId: string } | { type: "site" } | { type: "person" };

function AppInner() {
  const { state, dispatch } = useStore();
  const [view, setView] = useState<ViewMode>({ type: "board", boardId: state.boards[0]?.id });
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [addingBoard, setAddingBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardColumns, setNewBoardColumns] = useState("À faire, En cours, Fait");

  const openCard = state.cards.find((c) => c.id === openCardId) ?? null;

  function submitNewBoard() {
    const name = newBoardName.trim();
    if (!name) return;
    const columns = newBoardColumns
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    const id = `board-${Date.now()}`;
    dispatch({ type: "ADD_BOARD", board: { id, name, icon: "📋" }, columns: columns.length ? columns : ["À faire"] });
    setView({ type: "board", boardId: id });
    setNewBoardName("");
    setNewBoardColumns("À faire, En cours, Fait");
    setAddingBoard(false);
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-top">
          <h1>🗂️ Suivi de projets — Sacré-Cœur &amp; autres sites</h1>
          <p>Reproduction numérique du tableau mural, avec suivi centralisé multi-sites.</p>
        </div>
        <nav className="app-nav">
          <div className="app-nav-group">
            {state.boards.map((b) => (
              <button
                key={b.id}
                className={`nav-btn ${view.type === "board" && view.boardId === b.id ? "active" : ""}`}
                onClick={() => setView({ type: "board", boardId: b.id })}
              >
                {b.icon} {b.name}
              </button>
            ))}
            {addingBoard ? (
              <div className="add-board-form">
                <input
                  autoFocus
                  placeholder="Nom du tableau (ex. À faire aujourd'hui)"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                />
                <input
                  placeholder="Colonnes séparées par des virgules"
                  value={newBoardColumns}
                  onChange={(e) => setNewBoardColumns(e.target.value)}
                />
                <button onClick={submitNewBoard}>Créer</button>
                <button className="ghost" onClick={() => setAddingBoard(false)}>
                  Annuler
                </button>
              </div>
            ) : (
              <button className="nav-btn nav-btn-add" onClick={() => setAddingBoard(true)}>
                + Nouveau tableau
              </button>
            )}
          </div>
          <div className="app-nav-group">
            <button
              className={`nav-btn nav-btn-agg ${view.type === "site" ? "active" : ""}`}
              onClick={() => setView({ type: "site" })}
            >
              📍 Vue par site
            </button>
            <button
              className={`nav-btn nav-btn-agg ${view.type === "person" ? "active" : ""}`}
              onClick={() => setView({ type: "person" })}
            >
              👤 Vue par personne
            </button>
          </div>
        </nav>
      </header>

      <main className="app-main">
        {view.type === "board" && view.boardId && (
          <KanbanBoard boardId={view.boardId} onOpenCard={(c: CardData) => setOpenCardId(c.id)} />
        )}
        {view.type === "site" && <SiteView onOpenCard={(c) => setOpenCardId(c.id)} />}
        {view.type === "person" && <PersonView onOpenCard={(c) => setOpenCardId(c.id)} />}
      </main>

      {openCard && <CardModal card={openCard} onClose={() => setOpenCardId(null)} />}
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppInner />
    </StoreProvider>
  );
}
