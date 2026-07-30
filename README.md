# Suivi de projets

Version logicielle du tableau mural (post-it + compartiments) utilisé par
l'équipe : étiquettes draggables entre colonnes, personnes assignées visibles
sur chaque étiquette, fiche détail au clic, et suivi centralisé multi-sites.

## Fonctionnalités

- **Tableaux Kanban modulables** : chaque tableau (ex. « Tableau général »,
  « À faire aujourd'hui ») a ses propres colonnes (compartiments) et
  étiquettes. Les étiquettes se déplacent par glisser-déposer entre
  compartiments, comme sur le tableau physique. Tout est modifiable :
  **+ Nouveau tableau**, renommer/supprimer un tableau, ajouter/renommer/
  supprimer un compartiment.
- **Sites = établissements clients, gérés explicitement** : la Vue par site
  ne liste que les sites que vous avez créés (**+ Nouveau site**) — les
  tickets logiciels/internes sans site n'y apparaissent pas. Un ticket créé
  sur n'importe quel tableau (Aujourd'hui, Tableau général, etc.) rejoint
  automatiquement son site si le titre le mentionne (reconnaissance
  insensible aux accents/majuscules/orthographe), ou peut être assigné à la
  main dans sa fiche détail. On peut aussi créer un ticket directement depuis
  la fiche d'un site (**+ Ajouter un ticket à ce site**), en choisissant sur
  quel tableau/compartiment il doit apparaître.
- **Couleurs = priorité** : 🟢 vert = faible, 🟡 jaune = moyen, 🔴 rouge =
  urgent, 🔵 bleu = maintenance, 🟠 orange = autre. La couleur se met à jour
  automatiquement quand on change la priorité dans la fiche détail (le bleu et
  l'orange restent à choisir manuellement).
- **Fiche détail** : cliquer sur une étiquette ouvre sa fiche complète
  (couleur, compartiment, site, personnes assignées, échéance, priorité,
  description) ainsi qu'un **journal de suivi** où chacun peut poster une
  mise à jour d'avancement horodatée.
- **Vue par site** et **vue par personne** : agrègent les étiquettes de tous
  les tableaux, pour voir qui travaille sur quoi et où, sans dépendre d'un
  seul interlocuteur.
- **Liens de partage en lecture seule** : le bouton 🔗 Partager (sur un
  tableau ou sur un site précis) génère un lien qui ne montre que cette
  vue-là — utile pour donner de la visibilité à une personne externe (ex. un
  client d'un site donné) sans lui donner accès au reste du suivi. Le lien
  encode un instantané des données directement dans l'URL : il ne nécessite
  ni compte ni serveur, et **ne périme jamais** — mais il reste figé à
  l'instant où il a été généré ; il suffit de renvoyer un nouveau lien pour
  partager une version à jour.

Les données de travail sont conservées dans le `localStorage` du navigateur
(pas de backend requis pour ce prototype).

## Développement

```bash
npm install
npm run dev      # serveur de développement
npm run build    # build de production dans dist/
```
