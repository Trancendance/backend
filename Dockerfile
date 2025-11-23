# NODEMON BUILD
FROM transcendence-base
WORKDIR /usr/src/app
COPY . .
RUN npm install

RUN npm run build

# Rebuild better-sqlite3 si es necesario
RUN npm rebuild better-sqlite3

# Variables para proxy interno
EXPOSE 8083 8082
ENV DB_URL=https://transcendence_db:3000
ENV ALLOW_SELF_SIGNED=true
CMD ["npm", "run", "dev"]
