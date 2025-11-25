// backend/src/microservices/api/server.ts
import fastify from '../fastify.js';
import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import fjwt from "@fastify/jwt";
import path from 'path';
import fs from 'fs';
import { sequelize } from '../sequelize.js';
import { initializeAllModels } from '../sequelize.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

// CORS millorar poc segur, deixa entrar a tothom
fastify.addHook(
  "onRequest",
  (request: FastifyRequest, reply: FastifyReply, done) => {
    reply.header("Access-Control-Allow-Origin", "*");
    reply.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    reply.header("Access-Control-Allow-Headers", "Content-Type");
    if (request.method === "OPTIONS") {
      reply.status(200).send();
      return;
    }
    done();
  }
);

fastify.register(fjwt, {
  secret: 'MARIA',
  sign: {
    expiresIn: '1h'
  }
});

//https://3000/health
fastify.get("/health", async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // Verificar que la BD responde
    await sequelize.authenticate();
    reply.send({ 
      status: 'OK', 
      service: 'API Server', 
      port: `${PORT}`,
      database: 'sequelize Connected'
    });
  } catch (error: any) {
    console.error('Database health check failed:', error);
    reply.status(500).send({ 
      status: 'ERROR', 
      service: 'API Server',
      database: 'sequelize Disconnected',
      error: error.message 
    });
  }
});

const loadRouters = async () => {
  const routerFiles = fs.readdirSync(path.resolve(__dirname, "./routers"));
  for (const file of routerFiles) {
    if (!file.match(/\.(js)$/)) continue;

    try {
      const name = `/${file.replace(/\.js$/, '').replace(/index/, '')}`;
      const modulePath = `./routers/${file}`;
      const routerModule = await import(modulePath);

      fastify.register(routerModule.default || routerModule, { prefix: name });

      console.log("Loaded router", name, "from", file);
    } catch (error: any) {
      console.error(`ERROR loading route of file ${file} error:`, error);
    }
  }
};
// Status page
fastify.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
  reply.type("text/html").send(`
    <html>
      <body>
        <h1> API Server</h1>
        <p>Puerto: ${PORT}</p>
        <p>Servicio funcionando correctamente</p>
        <p>Environment: ${process.env.NODE_ENV || "development"}</p>
        <a href="/health">Health Check</a> | 
        <a href="/api">API Players</a>
      </body>
    </html>
  `);
});

const start = async () => {
  try {
    await sequelize.authenticate();
    await initializeAllModels();

    // await sequelize.sync({ force: false });//Crea les taules automàticament segons els models // force: false para no borrar datos existentes
    await loadRouters();//carrega le srutes
    await fastify.listen({ port: Number(PORT), host: '0.0.0.0' });//inicia servidor
    console.log(`🚀 API Server en https://localhost:${PORT}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();

export default fastify;
