import type { AppState, CardData, ColumnData, SiteData } from "./types";

const GENERAL = "board-general";
const TODAY = "board-today";

const SITE_SACRE_COEUR = "site-sacre-coeur";
const SITE_TROCADERO = "site-trocadero";

const sites: SiteData[] = [
  { id: SITE_SACRE_COEUR, name: "Sacré-Cœur" },
  { id: SITE_TROCADERO, name: "Trocadéro" },
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

function card(partial: Partial<CardData> & Pick<CardData, "id" | "boardId" | "columnId" | "order" | "title" | "color">): CardData {
  return {
    assignees: [],
    log: [],
    ...partial,
  };
}

const generalCards: CardData[] = [
  card({ id: "c1", boardId: GENERAL, columnId: "col-dev", order: 0, title: "SEGUR PSC", color: "red", assignees: ["JC", "JOE"] }),
  card({ id: "c2", boardId: GENERAL, columnId: "col-dev", order: 1, title: "SEGUR Documents", color: "red", assignees: ["Coco", "Reda"] }),
  card({ id: "c3", boardId: GENERAL, columnId: "col-dev", order: 2, title: "Sysco Endo V21", color: "orange", note: "Cible : juillet" }),
  card({ id: "c4", boardId: GENERAL, columnId: "col-dev", order: 3, title: "GED", color: "green" }),
  card({ id: "c5", boardId: GENERAL, columnId: "col-dev", order: 4, title: "SEGUR INS", color: "red" }),

  card({ id: "c6", boardId: GENERAL, columnId: "col-test", order: 0, title: "POC CenVal Esprit", color: "red", assignees: ["Benoit", "Fouad"] }),
  card({ id: "c7", boardId: GENERAL, columnId: "col-test", order: 1, title: "Sauvegarde + 6GLTPD V8", color: "yellow", note: "Prévu 28-29/07" }),
  card({ id: "c8", boardId: GENERAL, columnId: "col-test", order: 2, title: "Laurentides", color: "yellow", assignees: ["Erwan"] }),
  card({ id: "c9", boardId: GENERAL, columnId: "col-test", order: 3, title: "Endo - CRA", color: "blue", assignees: ["Erwan"] }),
  card({ id: "c10", boardId: GENERAL, columnId: "col-test", order: 4, title: "APHIP", color: "orange", assignees: ["Angel"] }),

  card({ id: "c11", boardId: GENERAL, columnId: "col-prod", order: 0, title: "HNOV PC", color: "yellow", note: "À replanifier" }),
  card({
    id: "c12",
    boardId: GENERAL,
    columnId: "col-prod",
    order: 1,
    title: "Sacré-Cœur",
    color: "orange",
    siteId: SITE_SACRE_COEUR,
    priority: "urgente",
    note: "Suivi si n° de dalle",
    description:
      "Correction des problèmes du site Sacré-Cœur. Plusieurs nouvelles ressources sont arrivées récemment sur ce dossier.",
    log: [
      {
        id: "log-c12-1",
        date: new Date().toISOString(),
        author: "Système",
        text: "Nikolas Besner (client) demande une meilleure visibilité sur qui travaille sur quoi et l'avancement à Sacré-Cœur.",
      },
    ],
  }),
  card({ id: "c13", boardId: GENERAL, columnId: "col-prod", order: 2, title: "Trocadéro Vision", color: "orange", siteId: SITE_TROCADERO }),

  card({ id: "c14", boardId: GENERAL, columnId: "col-demarrage", order: 0, title: "Lyon Sud Station", color: "yellow", dueDate: "2026-07-20" }),
  card({ id: "c15", boardId: GENERAL, columnId: "col-demarrage", order: 1, title: "Hexagone - Best Pratiques", color: "yellow", note: "Prévu septembre" }),
  card({ id: "c16", boardId: GENERAL, columnId: "col-demarrage", order: 2, title: "Ticket dont...", color: "red" }),
  card({ id: "c17", boardId: GENERAL, columnId: "col-demarrage", order: 3, title: "HCL", color: "yellow", dueDate: "2026-07-27" }),
  card({ id: "c18", boardId: GENERAL, columnId: "col-demarrage", order: 4, title: "MICI", color: "yellow", dueDate: "2026-07-03" }),

  card({ id: "c19", boardId: GENERAL, columnId: "col-maintenance", order: 0, title: "VND", color: "blue" }),

  card({ id: "c20", boardId: GENERAL, columnId: "col-avenir", order: 0, title: "Sysco Vision C", color: "blue" }),
  card({ id: "c21", boardId: GENERAL, columnId: "col-avenir", order: 1, title: "BIZET", color: "red" }),
];

const todayCards: CardData[] = [
  card({
    id: "t1",
    boardId: TODAY,
    columnId: "col-today-todo",
    order: 0,
    title: "Organiser le suivi centralisé Sacré-Cœur",
    color: "orange",
    siteId: SITE_SACRE_COEUR,
    assignees: ["Serge", "Maxime"],
    priority: "urgente",
    description:
      "Répondre à la demande de Nikolas Besner : mettre en place un suivi centralisé (ce logiciel), et l'y inclure.",
  }),
  card({
    id: "t2",
    boardId: TODAY,
    columnId: "col-today-cours",
    order: 0,
    title: "Sacré-Cœur — suivi n° de dalle",
    color: "orange",
    siteId: SITE_SACRE_COEUR,
  }),
];

export function getSeedState(): AppState {
  return {
    boards: [
      { id: GENERAL, name: "Tableau général", icon: "🗂️", locked: true },
      { id: TODAY, name: "À faire aujourd'hui", icon: "☀️", locked: true },
    ],
    columns: [...generalColumns, ...todayColumns],
    cards: [...generalCards, ...todayCards],
    sites,
  };
}
