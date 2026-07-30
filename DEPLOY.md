# Déployer SysView sur le VPS (Debian + Docker)

SysView est maintenant composé de deux parties :
- un **serveur** (Node.js + WebSocket) qui garde les données en mémoire et les
  sauvegarde dans un fichier JSON partagé — tout le monde qui se connecte voit
  et modifie les mêmes données, en temps réel ;
- un **reverse proxy Caddy** qui obtient et renouvelle automatiquement un
  certificat HTTPS (Let's Encrypt) pour votre domaine.

## Prérequis

1. Un nom de domaine (ou sous-domaine) qui pointe vers l'IP publique du VPS.
   Exemple utilisé dans ce dépôt : `sysview.yansys.fr`. Chez votre registrar,
   créez un enregistrement **A** : `sysview.yansys.fr → <IP publique du VPS>`.
2. Les ports **80** et **443** ouverts sur le pare-feu du VPS (Let's Encrypt a
   besoin du port 80 pour valider le domaine).
3. Docker et Docker Compose installés sur le VPS (`docker compose version`).

Si votre domaine n'est pas `sysview.yansys.fr`, modifiez la première ligne du
fichier `Caddyfile` avant de démarrer.

## Étapes

```bash
# 1. Récupérer le code sur le VPS
git clone <url-du-repo> sysview
cd sysview
git checkout claude/tableau-suivi-sacre-coeur-caaohn   # ou la branche/tag à déployer

# 2. Définir le mot de passe partagé de l'équipe
cp .env.example .env
nano .env   # remplacez APP_PASSWORD par un vrai mot de passe

# 3. Construire et démarrer
docker compose up -d --build

# 4. Suivre les logs (Caddy doit obtenir le certificat au premier démarrage)
docker compose logs -f caddy
```

Au bout de quelques secondes, `https://sysview.yansys.fr` doit être
accessible avec un cadenas valide. La première fois, tout le monde doit
entrer le mot de passe partagé (défini dans `.env`) pour accéder à l'appli.

## Vérifier que ça tourne

```bash
docker compose ps
curl -I https://sysview.yansys.fr
```

## Sauvegardes

Les données vivent dans le volume Docker `sysview_data` (fichier
`state.json`). Pour une sauvegarde manuelle :

```bash
docker run --rm -v sysview_data:/data -v "$PWD":/backup alpine \
  cp /data/state.json /backup/sysview-backup-$(date +%F).json
```

## Mettre à jour après un nouveau commit

```bash
git pull
docker compose up -d --build
```

Les données existantes ne sont pas touchées (elles vivent dans le volume, pas
dans l'image).

## Changer le mot de passe partagé

Modifiez `APP_PASSWORD` dans `.env`, puis :

```bash
docker compose up -d
```

Tout le monde devra se reconnecter avec le nouveau mot de passe (l'ancien
lien de session arrête de fonctionner).
