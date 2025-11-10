// backend/src/microservices/websocket/server.js
import Fastify from "fastify";
import websocketPlugin from "@fastify/websocket";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

await fastify.register(websocketPlugin);

// Chat state
let chatClients = [];
let chatMessages = [];

// Status page
fastify.get("/", async (req, reply) => {
  reply.type('text/html').send(`
    <html>
      <body>
        <h1>WebSocket Chat Server</h1>
        <p>Puerto: 8082</p>
        <p>Servicio funcionando correctamente</p>
        <p>Clientes de chat: ${chatClients.length}</p>
        <p>Mensajes en chat: ${chatMessages.length}</p>
        <a href="/test-chat.html">Test Chat</a>
      </body>
    </html>
  `);
});

fastify.get('/ws-health', async (request, reply) => {
  reply.send({ service: 'WebSocket', status: 'OK' });
});

// WebSocket chat endpoint
fastify.get("/chat", { websocket: true }, (socket, req) => {
  console.log("✅ Nuevo cliente de chat conectado");
  const user = `User${Math.floor(Math.random() * 1000)}`;
  
  const client = { socket, user };
  chatClients.push(client);

  // Enviar historial de mensajes al nuevo cliente
  socket.send(JSON.stringify({
    type: 'history',
    messages: chatMessages.slice(-50) // últimos 50 mensajes
  }));

  // Notificar a todos que un usuario se unió
  broadcast({
    type: 'user_joined',
    user: user
  }, client);

  socket.on("message", (message) => {
    try {
      const parsed = JSON.parse(message.toString());
      
      if (parsed.type === "message" && parsed.text.trim()) {
        const chatMessage = {
          type: 'message',
          user: user,
          text: parsed.text.trim(),
          timestamp: new Date().toLocaleTimeString()
        };
        
        // Guardar mensaje
        chatMessages.push(chatMessage);
        
        // Limitar historial a 100 mensajes
        if (chatMessages.length > 100) {
          chatMessages = chatMessages.slice(-100);
        }
        
        // Broadcast a todos los clientes
        broadcast(chatMessage);
      }
    } catch (e) {
      console.error("Error parsing chat message", e);
    }
  });

  socket.on("close", () => {
    chatClients = chatClients.filter((c) => c.socket !== socket);
    
    // Notificar que el usuario salió
    broadcast({
      type: 'user_left',
      user: user
    });
    
    console.log(`👋 Cliente de chat ${user} desconectado`);
  });
});

function broadcast(message, excludeClient = null) {
  const messageStr = JSON.stringify(message);
  chatClients.forEach(client => {
    if (client !== excludeClient) {
      try {
        client.socket.send(messageStr);
      } catch (e) {
        // Client disconnected
      }
    }
  });
}

const start = async () => {
  try {
    await fastify.listen({ port: 8082, host: "0.0.0.0" });
    console.log("🚀 WebSocket Chat Server en:");
    console.log("   • HTTPS: https://localhost:8082");
    console.log("   • WSS:   wss://localhost:8082/chat");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();