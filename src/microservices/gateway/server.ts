// backend/src/microservices/gateway/gateway.ts
import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import staticPlugin from '@fastify/static';

// Interfaces
interface HealthResponse {
  status: string;
  service: string;
  port: number;
  database_service?: string;
  db_health?: any;
  error?: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
}

const DB_URL: string = process.env.DB_URL || 'https://transcendence_db:3000';

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

const fastify: FastifyInstance = Fastify({
  logger: true,
  https: {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  },
});

// CORS básico (ajusta origin más adelante)
fastify.addHook('onRequest', (request: FastifyRequest, reply: FastifyReply, done: () => void) => {
  reply.header('Access-Control-Allow-Origin', '*');
  reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  reply.header('Access-Control-Allow-Headers', 'Content-Type');
  if (request.method === 'OPTIONS') return reply.status(200).send();
  done();
});

// Servir estáticos y /pong
await fastify.register(staticPlugin, { root: publicDir, prefix: '/static/' });
fastify.get('/pong', async (req: FastifyRequest, reply: FastifyReply) => reply.sendFile('pong.html'));

// Health del gateway + del microservicio DB
fastify.get('/health', async (_req: FastifyRequest, reply: FastifyReply) => {
  try {
    const res = await fetch(`${DB_URL}/health`);
    const dbStatus = await res.json().catch(() => ({}));
    const response: HealthResponse = {
      status: 'OK',
      service: 'API Gateway',
      port: 8080,
      database_service: dbStatus?.status === "OK" ? "Connected" : "Unknown",
      db_health: dbStatus,
    };
    reply.send(response);
  } catch (error: any) {
    const response: HealthResponse = {
      status: 'OK',
      service: 'API Gateway',
      port: 8080,
      database_service: "Unreachable",
      error: error?.message,
    };
    reply.send(response);
  }
});

// Proxy /api hacia el microservicio DB
fastify.all('/api', async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const route: string = (request.query as any).route || 'players';
    const url = `${DB_URL}/api?route=${encodeURIComponent(route)}`;

    const headers: HeadersInit = { 'content-type': 'application/json' };
    const method: string = request.method.toUpperCase();
    const needsBody: boolean = ['POST', 'PUT', 'DELETE'].includes(method);
    const body: string | undefined = needsBody ? JSON.stringify(request.body || {}) : undefined;

    const res = await fetch(url, { method, headers, body });
    const contentType: string = res.headers.get('content-type') || 'application/json';
    const text: string = await res.text();

    reply.status(res.status).type(contentType).send(text);
  } catch (err: any) {
    request.log.error({ err }, 'Gateway proxy error');
    const errorResponse: ApiResponse = { success: false, message: 'Upstream DB service error' };
    reply.status(502).send(errorResponse);
  }
});

// Página de estado
fastify.get('/', async (_request: FastifyRequest, reply: FastifyReply) => {
  reply.type('text/html').send(`
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

const start = async (): Promise<void> => {
  try {
    await fastify.listen({ port: 8080, host: "0.0.0.0" });
    fastify.log.info("API Gateway en https://localhost:8080");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
