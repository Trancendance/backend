// backend/src/microservices/api/server.ts
import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { sequelize } from '../sequelize.js';

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
  const routerFiles = fs.readdirSync(path.resolve(__dirname, './routers'));
  for (const file of routerFiles) 
  {
    // Solo cargar archivos .js, ignorar .d.ts, .ts y .map
    if (!file.endsWith('.js') || file.endsWith('.d.ts') || file.endsWith('.ts') || file.endsWith('.map')) {
      console.log(`Skipping non-JS file: ${file}`);
      continue;
    }
    
    console.log(file);
    // const name = `/${file.replace(/\.(js|ts)$/, '').replace(/index/, '')}`;
    
    try {
      const name = `/${file.replace(/\.js$/, '').replace(/index/, '')}`;
      const modulePath = `./routers/${file}`;
      const routerModule = await import(modulePath);
      
      fastify.register(routerModule.default || routerModule, {prefix: name});
      
      console.log('Loaded router', name, 'from', file);
    } catch (error: any) {
      console.error(`ERROR loading route of file ${file} error:`, error);
    }
  }
};

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
    await sequelize.authenticate();//Comprova que pot connectar a la BBDD
    console.log('DB connexion done!');
    // Inicializar modelos explícitamente
    const { initializeModels } = await import('./models/index.js');
    await initializeModels();

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
