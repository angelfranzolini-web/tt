import type { AppState, CardData, ColumnData, SiteData } from "./types";

const GENERAL = "board-general";
const TODAY = "board-today";

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

const cards: CardData[] = [];

export function getSeedState(): AppState {
  return {
    boards: [
      { id: GENERAL, name: "Tableau général", icon: "🗂️", locked: true },
      { id: TODAY, name: "À faire aujourd'hui", icon: "☀️", locked: true },
    ],
    columns: [...generalColumns, ...todayColumns],
    cards,
    sites,
  };
}
