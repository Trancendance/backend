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

# PRIMERO copiar package.json para cache de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar backend
COPY . .

RUN mkdir -p /certs

COPY certs/fd_transcendence.key /usr/src/app/certs/fd_transcendence.key
COPY certs/fd_transcendence.crt /usr/src/app/certs/fd_transcendence.crt

# Rebuild better-sqlite3 si es necesario
RUN npm rebuild better-sqlite3

# Exponer el puerto del servidor que vols que corri
EXPOSE 3000
# HTTP (opcional)
# EXPOSE 8080

# Arrancar el servidor
CMD ["node", "index.js"]
