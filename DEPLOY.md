# Déployer SysView sur le VPS (Debian + Docker)

SysView est composé de trois parties :
- un **serveur** (Node.js + WebSocket) qui garde les données en mémoire et les
  sauvegarde dans un fichier JSON partagé — tout le monde qui se connecte voit
  et modifie les mêmes données, en temps réel ;
- **nginx** en reverse proxy devant le serveur, avec le support WebSocket ;
- **certbot** qui obtient et renouvelle automatiquement le certificat HTTPS
  (Let's Encrypt) utilisé par nginx.

## Prérequis

1. Un nom de domaine (ou sous-domaine) qui pointe vers l'IP publique du VPS.
   Exemple utilisé dans ce dépôt : `sysview.yansys.fr`. Chez votre registrar,
   créez un enregistrement **A** : `sysview.yansys.fr → <IP publique du VPS>`.
2. Les ports **80** et **443** ouverts sur le pare-feu du VPS (Let's Encrypt a
   besoin du port 80 pour valider le domaine).
3. Docker et Docker Compose installés sur le VPS (`docker compose version`).

Si votre domaine n'est pas `sysview.yansys.fr`, remplacez-le dans
`nginx/conf.d/sysview.conf` (2 occurrences) et dans `init-letsencrypt.sh`
avant de démarrer.

## Étapes (premier déploiement)

```bash
# 1. Récupérer le code sur le VPS
git clone <url-du-repo> sysview
cd sysview
git checkout claude/tableau-suivi-sacre-coeur-caaohn   # ou la branche/tag à déployer

# 2. Définir le mot de passe partagé de l'équipe
cp .env.example .env
nano .env   # remplacez APP_PASSWORD par un vrai mot de passe

# 3. Construire l'image de l'application
docker compose build

# 4. Amorcer le certificat HTTPS (une seule fois) : ce script crée un
#    certificat temporaire, démarre nginx, puis demande le vrai certificat
#    Let's Encrypt en mode webroot.
LETSENCRYPT_EMAIL=admin@yansys.fr ./init-letsencrypt.sh

# 5. Démarrer tous les services (nginx + certbot en renouvellement auto)
docker compose up -d
```

Au bout de quelques secondes, `https://sysview.yansys.fr` doit être
accessible avec un cadenas valide. Tout le monde entre le mot de passe
partagé (défini dans `.env`) pour accéder à l'appli.

Le certificat se renouvelle tout seul ensuite (le service `certbot` tourne en
tâche de fond et vérifie toutes les 12h).

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
dans l'image). Pas besoin de relancer `init-letsencrypt.sh` — le certificat
est déjà là et se renouvelle tout seul.

## Changer le mot de passe partagé

Modifiez `APP_PASSWORD` dans `.env`, puis :

```bash
docker compose up -d
```

Tout le monde devra se reconnecter avec le nouveau mot de passe (l'ancien
jeton arrête de fonctionner).
