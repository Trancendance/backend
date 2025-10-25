# Imagen base oficial de Node.js
FROM node:20-slim

# Instalar dependencias necesarias para better-sqlite3
RUN apt-get update && apt-get install -y \
    sqlite3 \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Crear directorio de trabajo
WORKDIR /usr/src/app

# Copiar backend
COPY . .

# Instalar dependencias
RUN npm install

RUN npm run build

# Rebuild better-sqlite3 si es necesario
RUN npm rebuild better-sqlite3

# Exponer el puerto del servidor que vols que corri
EXPOSE 8080 8082

# Variables para proxy interno
ENV DB_URL=https://transcendence_db:3000
ENV ALLOW_SELF_SIGNED=true

# Arrancar el servidor
CMD ["sh", "-c", "node dist/microservices/gateway/server.js & node dist/microservices/websocket/server.js & wait"]
