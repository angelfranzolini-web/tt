import type { AppState, CardData, ColumnData, SiteData } from "./types";
import { deriveUsersFromCards } from "./utils";

const GENERAL = "board-general";
const TODAY = "board-today";
const ACTION = "board-action";
const ACTION_COLUMN = "col-action-rows";

const sites: SiteData[] = [
  { id: "site-sacre-coeur", name: "Sacré-Cœur" },
  { id: "site-trocadero", name: "Trocadéro" },
];

const generalColumns: ColumnData[] = [
  { id: "col-dev", boardId: GENERAL, title: "Développement", order: 0 },
  { id: "col-test", boardId: GENERAL, title: "Environnement Test", order: 1 },
  { id: "col-prod", boardId: GENERAL, title: "Environnement Production", order: 2 },
  { id: "col-demarrage", boardId: GENERAL, title: "Démarrage", order: 3 },
  { id: "col-maintenance", boardId: GENERAL, title: "Maintenance", order: 4 },
  { id: "col-avenir", boardId: GENERAL, title: "Projets à venir", order: 5 },
];

const todayColumns: ColumnData[] = [
  { id: "col-today-todo", boardId: TODAY, title: "À faire", order: 0 },
  { id: "col-today-cours", boardId: TODAY, title: "En cours", order: 1 },
  { id: "col-today-fait", boardId: TODAY, title: "Fait", order: 2 },
];

const actionColumns: ColumnData[] = [{ id: ACTION_COLUMN, boardId: ACTION, title: "Actions", order: 0 }];

function actionRow(
  partial: Partial<CardData> & Pick<CardData, "id" | "order" | "title">
): CardData {
  return {
    boardId: ACTION,
    columnId: ACTION_COLUMN,
    color: "yellow",
    assignees: [],
    log: [],
    ...partial,
  };
}

const actionCards: CardData[] = [
  actionRow({ id: "act1", order: 0, title: "Test module connexion double", theme: "Endo", assignees: ["Erwan"], dueDate: "2026-07-23" }),
  actionRow({ id: "act2", order: 1, title: "Suivi quotidien", theme: "Bicêtre", assignees: ["Erwan"], dueDate: "2026-07-23" }),
  actionRow({ id: "act3", order: 2, title: "Endoscope Fuji — test à faire", theme: "Bicêtre", assignees: ["Sofyane"], note: "À planifier" }),
  actionRow({ id: "act4", order: 3, title: "Crash — nouvelle version installée sur 1 salle, à tester", theme: "Bicêtre", assignees: ["Angel"], note: "À planifier" }),
  actionRow({ id: "act5", order: 4, title: "PDF — version SC installée sur 2 salles (3 et 5), à tester", theme: "Bicêtre", assignees: ["Edwyn"], dueDate: "2026-07-23" }),
  actionRow({ id: "act6", order: 5, title: "Passage V20 → V21", theme: "Endo V21", assignees: ["JC"], dueDate: "2026-07-23" }),
  actionRow({ id: "act7", order: 6, title: "Configuration + installation V20 sauvegarde", theme: "Endo V21", assignees: ["JC", "Coco", "Angel", "Edwyn"], dueDate: "2026-07-23" }),
  actionRow({ id: "act8", order: 7, title: "Formation", theme: "Endo V21", assignees: ["Edwyn"], note: "28-29/07" }),
  actionRow({ id: "act9", order: 8, title: "Suivi quotidien (HL7)", theme: "Sacré-Cœur", assignees: ["Angel"] }),
  actionRow({ id: "act10", order: 9, title: "Version : suppression accueil manuel, +20 images", theme: "Sacré-Cœur", assignees: [] }),
  actionRow({ id: "act11", order: 10, title: "MAJ vision center", theme: "Hartmann", assignees: ["JY"], dueDate: "2026-07-22" }),
  actionRow({ id: "act12", order: 11, title: "Trouver 1 seul doublon id T", theme: "Hartmann", assignees: ["JY", "Sofyane"], dueDate: "2026-07-23" }),
  actionRow({ id: "act13", order: 12, title: "MAJ vision center pour paramétrable", theme: "Sauvegarde", assignees: ["Sofyane"] }),
  actionRow({ id: "act14", order: 13, title: "Installation", theme: "Sauvegarde", assignees: ["Yannick"] }),
];

export function getSeedState(): AppState {
  return {
    boards: [
      { id: GENERAL, name: "Tableau général", icon: "🗂️", locked: true },
      { id: TODAY, name: "À faire aujourd'hui", icon: "☀️", locked: true },
      { id: ACTION, name: "Tableau d'action", icon: "📝", locked: true, viewType: "table" },
    ],
    columns: [...generalColumns, ...todayColumns, ...actionColumns],
    cards: [...actionCards],
    sites,
    users: deriveUsersFromCards(actionCards),
  };
}
