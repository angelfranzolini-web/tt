# Déployer SysView (VPS partagé avec Apache)

Ce VPS héberge déjà d'autres sites/services de l'entreprise via **Apache**
sur les ports 80/443 (GitLab, Mattermost, Dolibarr, etc.). SysView tourne
donc dans Docker mais **écoute uniquement en local** (`127.0.0.1:8020`), et
c'est Apache — déjà en place — qui le publie sur
`https://sysview.yansys.fr`, exactement comme pour vos autres conteneurs
(`127.0.0.1:80xx->80/tcp`).

## Prérequis

1. Le DNS de `sysview.yansys.fr` doit pointer vers l'IP publique de ce VPS.
2. Docker et Docker Compose installés (déjà le cas sur cette machine).
3. Apache avec `mod_proxy`, `mod_proxy_http`, `mod_proxy_wstunnel` et
   `certbot`/`python3-certbot-apache` (déjà utilisés pour vos autres sites
   HTTPS sur ce serveur).

Le port `8020` est libre au moment de la rédaction de ce document — vérifiez
avec `sudo ss -tlnp | grep 8020` avant de démarrer ; si un autre service
l'utilise déjà, changez-le dans `docker-compose.yml` (`"127.0.0.1:8020:3000"`)
et dans la config Apache ci-dessous.

## 1. Construire et démarrer l'application

```bash
cd ~/SysView   # ou le dossier où vous avez mis les fichiers
cp .env.example .env   # si pas déjà fait ; mettez un vrai mot de passe
docker compose build
docker compose up -d
docker compose ps      # doit montrer "app" Up, écoutant sur 127.0.0.1:8020
```

À ce stade, `curl http://127.0.0.1:8020/api/health` depuis le VPS doit
répondre `{"ok":true}`. L'appli n'est pas encore accessible depuis
l'extérieur — c'est Apache qui doit la publier.

## 2. Configurer Apache pour sysview.yansys.fr

Activez les modules nécessaires (si pas déjà fait) :

```bash
sudo a2enmod proxy proxy_http proxy_wstunnel rewrite ssl
```

Créez `/etc/apache2/sites-available/sysview.yansys.fr.conf` :

```apache
<VirtualHost *:80>
    ServerName sysview.yansys.fr

    ProxyPreserveHost On
    # "upgrade=websocket" laisse passer la synchronisation temps réel
    # (WebSocket) en plus des requêtes HTTP normales.
    ProxyPass / http://127.0.0.1:8020/ upgrade=websocket
    ProxyPassReverse / http://127.0.0.1:8020/
</VirtualHost>
```

Activez le site et rechargez Apache :

```bash
sudo a2ensite sysview.yansys.fr
sudo systemctl reload apache2
```

À ce stade, `http://sysview.yansys.fr` (encore en HTTP) doit déjà afficher
SysView.

## 3. Ajouter le certificat HTTPS

```bash
sudo certbot --apache -d sysview.yansys.fr
```

Certbot va dupliquer le VirtualHost ci-dessus dans un bloc `<VirtualHost
*:443>` avec les certificats, et proposer de rediriger le HTTP vers HTTPS
(répondez oui). Ensuite `https://sysview.yansys.fr` doit fonctionner avec un
cadenas valide, y compris la synchronisation temps réel.

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

Les données existantes ne sont pas touchées (elles vivent dans le volume,
pas dans l'image). Rien à refaire côté Apache/certbot pour une mise à jour.

## Changer le mot de passe partagé

Modifiez `APP_PASSWORD` dans `.env`, puis :

```bash
docker compose up -d
```

Tout le monde devra se reconnecter avec le nouveau mot de passe.
