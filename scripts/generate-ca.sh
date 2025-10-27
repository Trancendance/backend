#!/bin/bash
# backend/scripts/generate-ca.sh - Generates the local CA outside the container

echo "Generating local CA for development..."

# Change to the script directory to ensure relative paths work( Cambia el directorio actual al directorio padre del lugar donde está el script.)
cd "$(dirname "$0")/.."

mkdir -p ../rootCA

echo "[1/3] Generating CA private key..."
openssl genrsa -out ../rootCA/rootCA.key 2048

echo "[2/3] Generating CA certificate..."
openssl req -x509 -new -nodes -key ../rootCA/rootCA.key -sha256 -days 3650 \
  -out ../rootCA/rootCA.crt \
  -subj "/C=ES/ST=Catalonia/L=Barcelona/O=42Barcelona/OU=CA/CN=42LocalCA"

echo "Local CA successfully generated!"
echo "Created files:"
echo "  - ../rootCA/rootCA.key (CA private key)"
echo "  - ../rootCA/rootCA.crt (CA certificate)"
echo "  - certs/rootCA.* (Copies for the backend)"
echo ""
echo "IMPORTANT: Install '../rootCA/rootCA.crt' in your browser"
echo " Open the file and install it as a trusted Certificate Authority"