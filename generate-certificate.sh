echo "Generating SSL certification"
openssl req -x509 -nodes -days 365 \
		-newkey rsa:2048 \
		-keyout certs/fd_transcendence.key \
		-out	certs/fd_transcendence.crt \
		-subj "/C=ES/ST=Catalonia/L=Barcelona/O=42Barcelona/OU=42 School/CN=fd_transcendence" \
		> /dev/null 2>&1
echo "SSL Certification Generated!"