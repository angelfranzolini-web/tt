#!/bin/bash
# Amorce le certificat HTTPS Let's Encrypt pour nginx + certbot.
# À lancer une seule fois, avant le tout premier "docker compose up -d".
# Basé sur le schéma classique nginx-certbot (certificat factice puis vrai
# certificat en mode webroot), adapté pour un seul domaine.
set -e

domain="sysview.yansys.fr"
email="${LETSENCRYPT_EMAIL:-admin@yansys.fr}"
rsa_key_size=4096
data_path="./certbot"

if [ -d "$data_path/conf/live/$domain" ]; then
  read -p "Un certificat existe déjà pour $domain. Le remplacer ? (y/N) " decision
  if [ "$decision" != "Y" ] && [ "$decision" != "y" ]; then
    exit
  fi
fi

echo "### Téléchargement des paramètres TLS recommandés ..."
mkdir -p "$data_path/conf" "$data_path/www"
curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$data_path/conf/options-ssl-nginx.conf"
curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$data_path/conf/ssl-dhparams.pem"

echo "### Création d'un certificat factice pour $domain ..."
mkdir -p "$data_path/conf/live/$domain"
docker compose run --rm --entrypoint "\
  openssl req -x509 -nodes -newkey rsa:$rsa_key_size -days 1 \
    -keyout '/etc/letsencrypt/live/$domain/privkey.pem' \
    -out '/etc/letsencrypt/live/$domain/fullchain.pem' \
    -subj '/CN=localhost'" certbot

echo "### Démarrage de nginx ..."
docker compose up -d nginx

echo "### Suppression du certificat factice ..."
docker compose run --rm --entrypoint "\
  rm -rf /etc/letsencrypt/live/$domain && \
  rm -rf /etc/letsencrypt/archive/$domain && \
  rm -rf /etc/letsencrypt/renewal/$domain.conf" certbot

echo "### Demande du vrai certificat Let's Encrypt ..."
docker compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    --email $email \
    -d $domain \
    --rsa-key-size $rsa_key_size \
    --agree-tos \
    --non-interactive" certbot

echo "### Rechargement de nginx ..."
docker compose exec nginx nginx -s reload

echo "### Terminé. https://$domain devrait maintenant avoir un certificat valide."
