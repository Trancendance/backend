#!/bin/bash
# generate-certificate.sh - Genera certificats SSL signats per la CA local

echo "🔐 Generant certificats SSL per Backend amb CA local..."

# Crear carpeta de certificats si no existeix
mkdir -p ../certs

# Rutes alternatives per buscar la CA
CA_KEY=""
CA_CRT=""

# Buscar la CA en diverses ubicacions possibles
if [ -f "../certs/rootCA.key" ] && [ -f "../certs/rootCA.crt" ]; then
    CA_KEY="../certs/rootCA.key"
    CA_CRT="../certs/rootCA.crt"
    echo "✅ CA trobada a: certs/"
elif [ -f "../../rootCA/rootCA.key" ] && [ -f "../../rootCA/rootCA.crt" ]; then
    CA_KEY="../../rootCA/rootCA.key"
    CA_CRT="../../rootCA/rootCA.crt"
    echo "✅ CA trobada a: ../../rootCA/"
else
    echo "❌ ERROR: No es troben els fitxers de la CA arrel"
    echo "   Executa primer: make generate-ca"
    echo "   O assegura't que existeixin:"
    echo "     - backend/certs/rootCA.key i backend/certs/rootCA.crt"
    echo "     - o ../../rootCA/rootCA.key i ../../rootCA/rootCA.crt"
    exit 1
fi

echo "[1/4] Generant clau privada del servidor..."
openssl genrsa -out ../certs/fd_transcendence.key 2048

echo "[2/4] Generant sol·licitud de signatura de certificat (CSR)..."
openssl req -new -key ../certs/fd_transcendence.key -out ../certs/fd_transcendence.csr \
    -subj "/C=ES/ST=Catalonia/L=Barcelona/O=42Barcelona/OU=Server/CN=localhost"

echo "[3/4] Creant fitxer d'extensions amb noms alternatius (SAN)..."
cat > ../certs/fd_transcendence.ext << EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = 127.0.0.1
DNS.3 = host.docker.internal
IP.1 = 127.0.0.1
EOF

echo "[4/4] Signant el certificat amb la CA arrel..."
openssl x509 -req -in ../certs/fd_transcendence.csr \
    -CA "$CA_CRT" -CAkey "$CA_KEY" -CAcreateserial \
    -out ../certs/fd_transcendence.crt -days 365 -sha256 -extfile ../certs/fd_transcendence.ext

# Netejar fitxers temporals
rm -f ../certs/fd_transcendence.csr ../certs/fd_transcendence.ext
rm -f ../certs/rootCA.srl 2>/dev/null

# Verificar que els certificats s'han generat correctament
if [ -f "../certs/fd_transcendence.key" ] && [ -f "../certs/fd_transcendence.crt" ]; then
    echo "✅ Certificats generats correctament a backend/certs/"
    echo "   - fd_transcendence.key (Clau privada del servidor)"
    echo "   - fd_transcendence.crt (Certificat signat per la CA)"
    echo ""
    echo "📋 Informació del certificat:"
    openssl x509 -in ../certs/fd_transcendence.crt -text -noout | grep -E "Subject:|Issuer:|Not Before|Not After|DNS:" | head -5
else
    echo "❌ Error generant els certificats"
    exit 1
fi

echo "💡 Recorda instal·lar 'rootCA/rootCA.crt' al teu navegador per evitar warnings de seguretat"