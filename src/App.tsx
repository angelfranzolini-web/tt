import { useEffect, useState } from "react";
import { StoreProvider, useStore } from "./store";
import LoginGate from "./components/LoginGate";
import KanbanBoard from "./components/KanbanBoard";
import ActionTableView from "./components/ActionTableView";
import CardModal from "./components/CardModal";
import SiteView from "./components/SiteView";
import PersonView from "./components/PersonView";
import UserView from "./components/UserView";
import LiveShareView from "./components/LiveShareView";
import { shareIdFromHash } from "./share";
import { COLOR_LEGEND, type CardData } from "./types";
import "./App.css";

type ViewMode = { type: "board"; boardId: string } | { type: "site" } | { type: "person" } | { type: "user" };

const STATUS_LABEL: Record<string, string> = {
  connecting: "🟡 Connexion…",
  connected: "🟢 Connecté",
  disconnected: "🔴 Hors ligne — nouvelle tentative…",
};

function AppInner({ logout }: { logout: () => void }) {
  const { state, dispatch, status, ready } = useStore();
  const [view, setView] = useState<ViewMode>({ type: "board", boardId: state.boards[0]?.id });
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [addingBoard, setAddingBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardColumns, setNewBoardColumns] = useState("À faire, En cours, Fait");

  const openCard = state.cards.find((c) => c.id === openCardId) ?? null;

  // Proactively assigns a permanent shareId to any site/board that doesn't
  // have one yet, so the "Partager" button always has a stable link ready —
  // no need to wait for a click before the id exists.
  useEffect(() => {
    for (const site of state.sites) {
      if (!site.shareId) {
        dispatch({ type: "ENSURE_SITE_SHARE", siteId: site.id, shareId: crypto.randomUUID().replace(/-/g, "") });
      }
    }
    for (const board of state.boards) {
      if (!board.shareId) {
        dispatch({ type: "ENSURE_BOARD_SHARE", boardId: board.id, shareId: crypto.randomUUID().replace(/-/g, "") });
      }
    }
  }, [state.sites, state.boards, dispatch]);

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

  if (!ready) {
    return <div className="app-loading">Chargement de SysView…</div>;
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <button className="icon-text-btn logout-corner-btn" onClick={logout}>
          Se déconnecter
        </button>
        <div className="app-header-top">
          <h1>
            <img src="/logo.png" alt="" className="app-logo" />
            SysView
          </h1>
          <p>Reproduction numérique du tableau mural, avec suivi centralisé multi-sites.</p>
          <div className="app-header-status">
            <span className="status-pill">{STATUS_LABEL[status]}</span>
          </div>
          <div className="color-legend">
            {COLOR_LEGEND.map((l) => (
              <span key={l.color} className="color-legend-item">
                <span className={`legend-dot color-${l.color}`} /> {l.label}
              </span>
            ))}
          </div>
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
            <button
              className={`nav-btn nav-btn-agg ${view.type === "user" ? "active" : ""}`}
              onClick={() => setView({ type: "user" })}
            >
              👥 Utilisateurs
            </button>
          </div>
        </nav>
      </header>

      <main className="app-main">
        {view.type === "board" &&
          view.boardId &&
          (state.boards.find((b) => b.id === view.boardId)?.viewType === "table" ? (
            <ActionTableView boardId={view.boardId} />
          ) : (
            <KanbanBoard boardId={view.boardId} onOpenCard={(c: CardData) => setOpenCardId(c.id)} />
          ))}
        {view.type === "site" && <SiteView onOpenCard={(c) => setOpenCardId(c.id)} />}
        {view.type === "person" && <PersonView onOpenCard={(c) => setOpenCardId(c.id)} />}
        {view.type === "user" && <UserView />}
      </main>

      {openCard && <CardModal card={openCard} onClose={() => setOpenCardId(null)} />}
    </div>
  );
}

function useShareId(): string | null {
  const [shareId, setShareId] = useState<string | null>(() => shareIdFromHash(window.location.hash));

  useEffect(() => {
    function onHashChange() {
      setShareId(shareIdFromHash(window.location.hash));
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return shareId;
}

export default function App() {
  const shareId = useShareId();

  if (shareId) {
    return <LiveShareView shareId={shareId} />;
  }

  return (
    <LoginGate>
      {(token, logout) => (
        <StoreProvider token={token} onUnauthorized={logout}>
          <AppInner logout={logout} />
        </StoreProvider>
      )}
    </LoginGate>
  );
}
