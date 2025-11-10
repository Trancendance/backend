// backend/src/microservices/api/server.ts
import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import db from '../database.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

// Certificats HTTPS
const keyPath = path.join(__dirname, '../../../certs/fd_transcendence.key');
const certPath = path.join(__dirname, '../../../certs/fd_transcendence.crt');

const httpsOptions = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath)
};

const fastify = Fastify({ 
  logger: true, 
  https: httpsOptions
});

// CORS millorar poc segur, deixa entrar a tothom
fastify.addHook('onRequest', (request: FastifyRequest, reply: FastifyReply, done) => {
  reply.header('Access-Control-Allow-Origin', '*');
  reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  reply.header('Access-Control-Allow-Headers', 'Content-Type');
  if (request.method === 'OPTIONS') {
    reply.status(200).send();
    return;
  }
  done();
});

//https://3000/health
fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // Verificar que la BD responde
    db.prepare('SELECT 1 as test').get();
    reply.send({ 
      status: 'OK', 
      service: 'API Server', 
      port: `${PORT}`,
      database: 'Connected'
    });
  } catch (error: any) {
    console.error('Database health check failed:', error);
    reply.status(500).send({ 
      status: 'ERROR', 
      service: 'API Server',
      database: 'Disconnected',
      error: error.message 
    });
  }
});

const loadRouters = async () => {
  const routerFiles = fs.readdirSync(path.resolve(__dirname, './routers'));
  for (const file of routerFiles) 
  {
    if (!file.match(/\.(js|ts)$/))
      continue;
    
    console.log(file);
    const name = `/${file.replace(/\.(js|ts)$/, '').replace(/index/, '')}`;
    
    try {
      const modulePath = `./routers/${file}`;
      const routerModule = await import(modulePath);
      
      fastify.register(routerModule.default || routerModule, {prefix: name});
      
      console.log('Loaded router', name, 'from', file);
    } catch (error: any) {
      console.error(`ERROR loading route of file ${file} error:`, error);
    }
  }
};

/*
// API Routes - Comentat perquè ara es carreguen dinàmicament
fastify.all('/api', async (request: FastifyRequest, reply: FastifyReply) => {
  const { method } = request;
  const data = request.body as any;
  const route = (request.query as any).route || 'players';

  if (route === 'players') {
    try {
      switch (method) {
        case 'GET':
          const players = db.prepare('SELECT player_id, alias, first_name, last_name, email FROM player').all();
          reply.send(players);
          break;

        case 'POST':
          if (!data.alias || !data.first_name || !data.last_name || !data.email) {
            return reply.status(400).send({ success: false, message: 'Datos incompletos' });
          }
          const stmt = db.prepare(
            'INSERT INTO player (alias, first_name, last_name, email) VALUES (?, ?, ?, ?)'
          );
          const res = stmt.run(data.alias, data.first_name, data.last_name, data.email, 'default_hash');
          reply.send({ success: true, message: 'Jugador añadido', id: res.lastID });
          break;

        case 'PUT':
          if (!data.player_id) {
            return reply.status(400).send({ success: false, message: 'ID requerido' });
          }
          const updateStmt = db.prepare('UPDATE player SET alias = ? WHERE player_id = ?');
          const updateRes = updateStmt.run(data.alias, data.player_id);
          if (updateRes.changes > 0) {
            reply.send({ success: true, message: 'Jugador actualizado' });
          } else {
            reply.status(404).send({ success: false, message: 'Jugador no encontrado' });
          }
          break;

        case 'DELETE':
          if (!data.player_id) {
            return reply.status(400).send({ success: false, message: 'ID requerido' });
          }
          const deleteStmt = db.prepare('DELETE FROM player WHERE player_id = ?');
          const deleteRes = deleteStmt.run(data.player_id);
          if (deleteRes.changes > 0) {
            reply.send({ success: true, message: 'Jugador eliminado' });
          } else {
            reply.status(404).send({ success: false, message: 'Jugador no encontrado' });
          }
          break;

        default:
          reply.status(405).send({ success: false, message: 'Método no permitido' });
      }
    } catch (err: any) {
      console.error('Error:', err);
      reply.status(500).send({ success: false, message: 'Error interno' });
    }
  } else {
    reply.status(404).send({ success: false, message: 'Ruta no encontrada' });
  }
});
*/

// Status page
fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
  reply.type('text/html').send(`
    <html>
      <body>
        <h1> API Server</h1>
        <p>Puerto: ${PORT}</p>
        <p>Servicio funcionando correctamente</p>
        <p>Environment: ${process.env.NODE_ENV || 'development'}</p>
        <a href="/health">Health Check</a> | 
        <a href="/api">API Players</a>
      </body>
    </html>
  `);
});

const start = async () => {
  try {
    await loadRouters();
    await fastify.listen({ port: Number(PORT), host: '0.0.0.0' });
    console.log(`🚀 API Server en https://localhost:${PORT}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
