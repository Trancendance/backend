import Fastify from "fastify";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import staticPlugin from "@fastify/static";

const DB_URL = process.env.DB_URL || "https://transcendence_db:3000";

// Permitir self-signed en dev (llamadas internas del gateway al microservicio DB)
if (process.env.ALLOW_SELF_SIGNED === "true") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Certificados del contenedor backend
const keyPath = path.join(__dirname, "../../../certs/fd_transcendence.key");
const certPath = path.join(__dirname, "../../../certs/fd_transcendence.crt");

// Directorio público para servir pong.html
const publicDir = path.join(__dirname, "../../../public");

const fastify = Fastify({
  logger: {
    transport: {
      target: "pino-pretty",
      options: {
        translateTime: false,
        ignore: "time,hostname,pid",
      },
    },
  },
  https: {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  },
});

// CORS básico (ajusta origin más adelante)
fastify.addHook("onRequest", (request, reply, done) => {
  reply.header("Access-Control-Allow-Origin", "*");
  reply.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  reply.header("Access-Control-Allow-Headers", "Content-Type");
  if (request.method === "OPTIONS") return reply.status(200).send();
  done();
});

// Servir estáticos y /pong
await fastify.register(staticPlugin, { root: publicDir, prefix: "/static/" });
fastify.get("/pong", async (req, reply) => reply.sendFile("pong.html"));

// Health del gateway + del microservicio DB
fastify.get("/health", async (_req, reply) => {
  try {
    const res = await fetch(`${DB_URL}/health`);
    const dbStatus = await res.json().catch(() => ({}));
    reply.send({
      status: "OK",
      service: "API Gateway",
      port: 8080,
      database_service: dbStatus?.status === "OK" ? "Connected" : "Unknown",
      db_health: dbStatus,
    });
  } catch (error) {
    reply.send({
      status: "OK",
      service: "API Gateway",
      port: 8080,
      database_service: "Unreachable",
      error: error?.message,
    });
  }
});

// Proxy /api hacia el microservicio DB
fastify.all("/api", async (request, reply) => {
  try {
    const route = request.query.route || "players";
    const url = `${DB_URL}/api?route=${encodeURIComponent(route)}`;

    const headers = { "content-type": "application/json" };
    const method = request.method.toUpperCase();
    const needsBody = ["POST", "PUT", "DELETE"].includes(method);
    const body = needsBody ? JSON.stringify(request.body || {}) : undefined;

    const res = await fetch(url, { method, headers, body });
    const contentType = res.headers.get("content-type") || "application/json";
    const text = await res.text();

    reply.status(res.status).type(contentType).send(text);
  } catch (err) {
    request.log.error({ err }, "Gateway proxy error");
    reply
      .status(502)
      .send({ success: false, message: "Upstream DB service error" });
  }
});

// Página de estado
fastify.get("/", async (_request, reply) => {
  reply.type("text/html").send(`
    <html>
      <body>
        <h1>API Gateway</h1>
        <p>Puerto: 8080</p>
        <p>Reenvío a DB Service: ${DB_URL}</p>
        <a href="/pong">Pong (conectividad)</a> |
        <a href="/health">Health</a> | 
        <a href="/api?route=players">API Players (proxy)</a>
      </body>
    </html>
  `);
});

const start = async () => {
  try {
    await fastify.listen({ port: 8080, host: "0.0.0.0" });
    fastify.log.info("API Gateway en https://localhost:8080");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
