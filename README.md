# SysView

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

- **Backend partagé en temps réel** : un petit serveur Node.js (WebSocket)
  garde les données côté serveur et les diffuse instantanément à tout le
  monde de connecté — plus de copie isolée par navigateur. Accès protégé par
  un mot de passe partagé simple (défini dans `.env`).

## Développement

```bash
npm install
npm run build     # build du frontend dans dist/
APP_PASSWORD=test123 npm run server   # démarre le serveur sur le port 3000
```

Ou, pour le rechargement à chaud du frontend pendant le développement
(nécessite le serveur ci-dessus lancé en parallèle, Vite proxifie `/api` et
`/ws` vers `http://localhost:3000`) :

```bash
npm run dev
```

## Déploiement en production (Docker + HTTPS)

Voir [`DEPLOY.md`](./DEPLOY.md) pour les instructions complètes de
déploiement sur un serveur Debian avec Docker, nginx et certbot (HTTPS
automatique via Let's Encrypt). En résumé :

```bash
cp .env.example .env   # puis éditez APP_PASSWORD
docker compose build
./init-letsencrypt.sh  # une seule fois, au tout premier déploiement
docker compose up -d
```
