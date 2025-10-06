#!/bin/bash

echo "Generant certificats SSL per Backend..."

# Crear carpeta si no existe
mkdir -p certs

# Generar certificado auto-firmado
openssl req -x509 -newkey rsa:4096 \
  -keyout certs/fd_transcendence.key \
  -out    certs/fd_transcendence.crt \
  -days 365 \
  -nodes \
  -subj "/C=ES/ST=Catalunya/L=Barcelona/O=42School/CN=localhost" \
  2>/dev/null

# Verificar que se generaron
if [ -f "certs/fd_transcendence.key" ] && [ -f "certs/fd_transcendence.crt" ]; then
  echo "Certificats generats en backend/certs/"
  echo "  - fd_transcendence.key"
  echo "  - fd_transcendence.crt"
else
  echo "Error generant certificats"
  exit 1
fi