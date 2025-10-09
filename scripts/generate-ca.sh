#!/bin/bash
# backend/scripts/generate-ca.sh - Genera la CA local fora del contenidor

echo "🏗️  Generant CA local per a desenvolupament..."

# Canviar al directori del script per assegurar rutes relatives
cd "$(dirname "$0")/.."

mkdir -p ../rootCA
mkdir -p certs

echo "[1/3] Generant clau privada de la CA..."
openssl genrsa -out ../rootCA/rootCA.key 2048

echo "[2/3] Generant certificat de la CA..."
openssl req -x509 -new -nodes -key ../rootCA/rootCA.key -sha256 -days 3650 \
  -out ../rootCA/rootCA.crt \
  -subj "/C=ES/ST=Catalonia/L=Barcelona/O=42Barcelona/OU=CA/CN=42LocalCA"

echo "[3/3] Copiant certificats CA als directoris necessaris..."
cp ../rootCA/rootCA.key certs/
cp ../rootCA/rootCA.crt certs/
cp ../rootCA/rootCA.crt ../frontend/certs/

echo "✅ CA local generada correctament!"
echo "📁 Fitxers creats:"
echo "   - ../rootCA/rootCA.key (Clau privada CA)"
echo "   - ../rootCA/rootCA.crt (Certificat CA)"
echo "   - certs/rootCA.* (Còpies per al backend)"
echo ""
echo "💡 IMPORTANT: Instal·la '../rootCA/rootCA.crt' al teu navegador"
echo "   Obre el fitxer i instal·la-lo com a Autoritat Certificadora de confiança"