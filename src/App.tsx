import { useEffect, useState } from "react";
import { StoreProvider, useStore } from "./store";
import LoginGate from "./components/LoginGate";
import KanbanBoard from "./components/KanbanBoard";
import CardModal from "./components/CardModal";
import SiteView from "./components/SiteView";
import PersonView from "./components/PersonView";
import ShareView from "./components/ShareView";
import { decodeSharePayloadFromHash, type SharePayload } from "./share";
import { COLOR_LEGEND, type CardData } from "./types";
import "./App.css";

type ViewMode = { type: "board"; boardId: string } | { type: "site" } | { type: "person" };

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
        <div className="app-header-top">
          <h1>
            <img src="/logo.png" alt="" className="app-logo" />
            SysView
          </h1>
          <p>Reproduction numérique du tableau mural, avec suivi centralisé multi-sites.</p>
          <div className="app-header-status">
            <span className="status-pill">{STATUS_LABEL[status]}</span>
            <button className="icon-text-btn" onClick={logout}>
              Se déconnecter
            </button>
          </div>
          <div className="color-legend">
            {COLOR_LEGEND.map((l) => (
              <span key={l.color} className="color-legend-item">
                {l.emoji} {l.label}
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

function useSharePayload(): SharePayload | null | undefined {
  const [payload, setPayload] = useState<SharePayload | null | undefined>(() =>
    decodeSharePayloadFromHash(window.location.hash)
  );

  useEffect(() => {
    function onHashChange() {
      setPayload(decodeSharePayloadFromHash(window.location.hash));
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return payload;
}

export default function App() {
  const sharePayload = useSharePayload();

  if (window.location.hash.startsWith("#share=")) {
    if (!sharePayload) {
      return <div className="share-error">Lien de partage invalide ou corrompu.</div>;
    }
    return <ShareView payload={sharePayload} />;
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
