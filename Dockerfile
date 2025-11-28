# # NODEMON BUILD
# FROM transcendence-base
# WORKDIR /usr/src/app
# COPY . .
# RUN npm install
# # Variables para proxy interno
# EXPOSE 8083 8082 3000
# ENV DB_URL=https://transcendence_db:3000
# ENV ALLOW_SELF_SIGNED=true
# CMD ["npm", "run", "dev"]
FROM transcendence-base
WORKDIR /usr/src/app
COPY . .
RUN npm install
RUN npm run build
EXPOSE 3000 8082 8083
ENV DB_PATH=/usr/src/app/data/transcendence.db
ENV ALLOW_SELF_SIGNED=true

# Ejecuta SOLO el servidor API para evitar conflictos
CMD ["node", "dist/microservices/api/server.js"]
# CMD ["npm", "run", "dev"]
