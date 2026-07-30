# Suivi de projets — Sacré-Cœur & autres sites

Version logicielle du tableau mural (post-it + compartiments) utilisé par
l'équipe : étiquettes draggables entre colonnes, personnes assignées visibles
sur chaque étiquette, fiche détail au clic, et suivi centralisé multi-sites.

## Fonctionnalités

- **Tableaux Kanban** : chaque tableau (ex. « Tableau général », « À faire
  aujourd'hui ») a ses propres colonnes (compartiments) et étiquettes. Les
  étiquettes se déplacent par glisser-déposer entre compartiments, comme sur
  le tableau physique. Le bouton **+ Nouveau tableau** permet de créer
  d'autres tableaux (par type de suivi, par équipe, etc.).
- **Fiche détail** : cliquer sur une étiquette ouvre sa fiche complète
  (couleur, compartiment, site/zone, personnes assignées, échéance,
  priorité, description) ainsi qu'un **journal de suivi** où chacun peut
  poster une mise à jour d'avancement horodatée.
- **Vue par site / zone** : agrège les étiquettes de tous les tableaux par
  site, avec qui travaille dessus et le dernier point d'avancement. Le site
  **Sacré-Cœur** est mis en avant en réponse à la demande de Nikolas Besner
  (visibilité centralisée sur qui fait quoi et l'avancement, sans dépendre
  d'un seul interlocuteur).
- **Vue par personne** : liste les missions en cours de chaque personne,
  tous tableaux et sites confondus.

Les données sont conservées dans le `localStorage` du navigateur (pas de
backend requis pour ce prototype).

## Développement

```bash
npm install
npm run dev      # serveur de développement
npm run build    # build de production dans dist/
```
