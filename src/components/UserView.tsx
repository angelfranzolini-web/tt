import { useState } from "react";
import { useStore } from "../store";
import ConfirmDialog, { type DialogRequest } from "./ConfirmDialog";

function AddUserForm() {
  const { dispatch } = useStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  function submit() {
    const n = name.trim();
    if (!n) return;
    dispatch({ type: "ADD_USER", name: n });
    setName("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button className="nav-btn nav-btn-add" onClick={() => setOpen(true)}>
        + Nouvel utilisateur
      </button>
    );
  }

  return (
    <div className="add-board-form">
      <input
        autoFocus
        placeholder="Nom de la personne"
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

export default function UserView() {
  const { state, dispatch } = useStore();
  const [dialog, setDialog] = useState<DialogRequest | null>(null);

  const users = [...state.users].sort((a, b) => a.name.localeCompare(b.name, "fr"));

  function renameUser(userId: string, current: string) {
    setDialog({
      title: "Renommer cette personne",
      mode: "prompt",
      defaultValue: current,
      confirmLabel: "Renommer",
      onConfirm: (value) => {
        if (value && value.trim()) dispatch({ type: "RENAME_USER", userId, name: value.trim() });
      },
    });
  }

  function deleteUser(userId: string, name: string) {
    setDialog({
      title: `Supprimer « ${name} » ?`,
      message:
        "Elle ne sera plus proposée dans le menu déroulant des personnes assignées. Les tickets déjà assignés à cette personne ne sont pas modifiés.",
      mode: "confirm",
      confirmLabel: "Supprimer",
      danger: true,
      onConfirm: () => dispatch({ type: "DELETE_USER", userId }),
    });
  }

  return (
    <div className="agg-view">
      <div className="agg-intro">
        <h2>Utilisateurs</h2>
        <p>
          La liste des personnes de l'équipe, utilisée pour proposer un menu déroulant filtrable
          lors de l'assignation d'un ticket. Ajoutez chaque personne une seule fois ici ; elle sera
          ensuite suggérée partout où on peut assigner quelqu'un.
        </p>
        <AddUserForm />
      </div>

      {users.length === 0 && (
        <p className="agg-empty-state">
          Aucun utilisateur créé pour le moment. Cliquez sur « + Nouvel utilisateur ».
        </p>
      )}

      {users.length > 0 && (
        <div className="agg-group">
          {users.map((user) => {
            const count = state.cards.filter((c) => c.assignees.includes(user.name)).length;
            return (
              <div key={user.id} className="user-row">
                <span className="user-row-name">{user.name}</span>
                <span className="agg-group-count">{count} ticket(s)</span>
                <button
                  className="column-icon-btn"
                  title="Renommer"
                  onClick={() => renameUser(user.id, user.name)}
                >
                  ✎
                </button>
                <button
                  className="column-icon-btn"
                  title="Supprimer"
                  onClick={() => deleteUser(user.id, user.name)}
                >
                  🗑
                </button>
              </div>
            );
          })}
        </div>
      )}
      {dialog && <ConfirmDialog request={dialog} onClose={() => setDialog(null)} />}
    </div>
  );
}
