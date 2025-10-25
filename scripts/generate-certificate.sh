#!/bin/bash
# generate-certificate.sh - Genera certificats SSL signats per la CA local

echo "Generating SSL certificates for Frontend with local CA..."

# Crear carpeta de certificats si no existeix
mkdir -p ../certs

# Rutes alternatives per buscar la CA
CA_KEY=""
CA_CRT=""

# Buscar la CA en diverses ubicacions possibles
if [ -f "../certs/rootCA.key" ] && [ -f "../certs/rootCA.crt" ]; then
    CA_KEY="../certs/rootCA.key"
    CA_CRT="../certs/rootCA.crt"
    echo "CA found at: certs/"
elif [ -f "../../rootCA/rootCA.key" ] && [ -f "../../rootCA/rootCA.crt" ]; then
    CA_KEY="../../rootCA/rootCA.key"
    CA_CRT="../../rootCA/rootCA.crt"
    echo "CA found at: ../../rootCA/"
else
    echo "ERROR: Can't find root CA files"
    echo "Execute first: make generate-ca"
    echo "Or make sure they exist:"
    echo "   - backend/certs/rootCA.key i backend/certs/rootCA.crt"
    echo "   - o ../../rootCA/rootCA.key i ../../rootCA/rootCA.crt"
    exit 1
fi

echo "[1/4] Generating private key from server..."
openssl genrsa -out ../certs/fd_transcendence.key 2048

echo "[2/4] Generating certificate signature request (CSR)..."
openssl req -new -key ../certs/fd_transcendence.key -out ../certs/fd_transcendence.csr \
    -subj "/C=ES/ST=Catalonia/L=Barcelona/O=42Barcelona/OU=Server/CN=localhost"

echo "[3/4] Creating extensions files with alternative names (SAN)..."
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

echo "[4/4] Signing certificate with root CA..."
openssl x509 -req -in ../certs/fd_transcendence.csr \
    -CA "$CA_CRT" -CAkey "$CA_KEY" -CAcreateserial \
    -out ../certs/fd_transcendence.crt -days 365 -sha256 -extfile ../certs/fd_transcendence.ext

# Netejar fitxers temporals
rm -f ../certs/fd_transcendence.csr ../certs/fd_transcendence.ext
rm -f ../certs/rootCA.srl 2>/dev/null

# Verificar que els certificats s'han generat correctament
if [ -f "../certs/fd_transcendence.key" ] && [ -f "../certs/fd_transcendence.crt" ]; then
    echo "Successfully generated certificates in backend/certs/"
    echo "   - fd_transcendence.key (Private key)"
    echo "   - fd_transcendence.crt (Certificate signed by the CA)"
    echo ""
    echo "Certificate Information:"
    openssl x509 -in ../certs/fd_transcendence.crt -text -noout | grep -E "Subject:|Issuer:|Not Before|Not After|DNS:" | head -5
else
    echo "Error generating certificates"
    exit 1
fi

echo "Remember to install 'rootCA/rootCA.crt' in your browser to avoid security warnings"