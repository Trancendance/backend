# NODEMON BUILD
FROM transcendence-base
WORKDIR /usr/src/app
COPY . .
RUN npm install
# Variables para proxy interno
EXPOSE 8083 8082
ENV DB_URL=https://transcendence_db:3000
ENV ALLOW_SELF_SIGNED=true
CMD ["npm", "run", "dev"]
