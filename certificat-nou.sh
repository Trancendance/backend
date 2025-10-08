#!/bin/bash
#set -e
#
#mkdir -p /app/certs
#mkdir -p /app/rootCA
#
#echo "[1/4] Generant Root CA..."
#openssl req -x509 -sha256 -days 1825 -nodes -newkey rsa:2048 \
#  -keyout /app/certs/rootCA.key -out /app/certs/rootCA.crt \
#  -subj "/C=ES/ST=Catalonia/L=Barcelona/O=42Barcelona/OU=CA/CN=42LocalCA"
#
## Copiem la CA pública fora per importar-la a Firefox
#cp /app/certs/rootCA.crt /app/rootCA/rootCA.crt
#
#echo "[2/4] Generant clau i CSR del servidor..."
#openssl req -new -nodes -newkey rsa:2048 \
#  -keyout /app/certs/domain.key -out /app/certs/domain.csr \
#  -subj "/C=ES/ST=Catalonia/L=Barcelona/O=42Barcelona/OU=Server/CN=localhost"
#
#echo "[3/4] Creant extensions SAN..."
#cat > /app/certs/domain.ext <<EOF
#authorityKeyIdentifier=keyid,issuer
#basicConstraints=CA:FALSE
#subjectAltName = @alt_names
#
#[alt_names]
#DNS.1 = localhost
#DNS.2 = 127.0.0.1
#EOF
#
#echo "[4/4] Signant certificat del servidor amb la Root CA..."
#openssl x509 -req -in /app/certs/domain.csr \
#  -CA /app/certs/rootCA.crt -CAkey /app/certs/rootCA.key -CAcreateserial \
#  -out /app/certs/domain.crt -days 365 -sha256 -extfile /app/certs/domain.ext
#
#echo "Certificats generats!"
#
## arrenca el servidor node
#exec npm start