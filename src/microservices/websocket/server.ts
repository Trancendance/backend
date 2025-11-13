// backend/src/microservices/websocket/server.js
import Fastify from "fastify";
import websocketPlugin from "@fastify/websocket";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { tempChatService } from "./services/TempChat.js";
import { TempChatController } from './controllers/TempChat.js';
import { initializeAllModels } from '../sequelize.js';

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
await initializeAllModels();

fastify.get("/", async (req, reply) => {
  const stats = tempChatService.getStats();
  
  reply.type('text/html').send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Temp Chat WebSocket Server</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                max-width: 800px; 
                margin: 0 auto; 
                padding: 20px; 
                background-color: #f5f5f5;
            }
            .container { 
                background: white; 
                padding: 30px; 
                border-radius: 10px; 
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .stats { 
                background: #e8f5e8; 
                padding: 15px; 
                border-radius: 5px; 
                margin: 20px 0;
            }
            .chat-container {
                margin-top: 30px;
                border: 1px solid #ddd;
                border-radius: 5px;
                padding: 15px;
            }
            #messages { 
                height: 300px; 
                overflow-y: auto; 
                border: 1px solid #ccc; 
                padding: 10px; 
                margin-bottom: 10px;
                background: #f9f9f9;
            }
            #messageInput { 
                width: 70%; 
                padding: 8px; 
                margin-right: 10px;
            }
            button { 
                padding: 8px 15px; 
                background: #007cba; 
                color: white; 
                border: none; 
                border-radius: 4px; 
                cursor: pointer;
            }
            button:hover { background: #005a87; }
            .message { margin: 5px 0; }
            .user { font-weight: bold; color: #007cba; }
            .timestamp { font-size: 0.8em; color: #666; }
            .system { color: #666; font-style: italic; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Temp Chat WebSocket Server</h1>
            
            <div class="stats">
                <p><strong>Port:</strong> 8082</p>
                <p><strong>Service Status:</strong> ✅ Running</p>
                <p><strong>Connected Clients:</strong> ${stats.clients}</p>
            </div>

            <div class="chat-container">
                <h3>Live Temp Chat - Stream 1</h3>
                <div id="messages"></div>
                <div>
                    <input type="text" id="messageInput" placeholder="Type your message...">
                    <button id="sendButton">Send</button>
                    <button id="deleteButton">Delete Stream</button>
                </div>
            </div>
        </div>

        <script>
            let ws;
            let currentUser = 'User' + Math.floor(Math.random() * 1000);
            
            function connectWebSocket() {
                // Conectar al stream temporal 1
                ws = new WebSocket('wss://localhost:8082/temp-chat/stream/1');
                
                ws.onopen = function() {
                    console.log('✅ Connected to temp stream 1');
                };
                
                ws.onmessage = function(event) {
                    const data = JSON.parse(event.data);
                    
                    if (data.type === 'history') {
                        // Limpiar y cargar historial
                        document.getElementById('messages').innerHTML = '';//AQUI CAL COMENTAR
                        data.messages.forEach(msg => {
                            addMessage(msg.alias, msg.text, msg.type, msg.timestamp);
                        });
                    } else {
                        // Mensaje normal, unión o salida
                        addMessage(data.alias, data.text, data.type, data.timestamp);
                    }
                };
                
                ws.onclose = function() {
                    addMessage('System', 'Disconnected from temp chat', 'system');
                    setTimeout(connectWebSocket, 3000);
                };
                
                ws.onerror = function(error) {
                    console.error('WebSocket error:', error);
                };
            }
            
            function sendMessage() {
                const input = document.getElementById('messageInput');
                const text = input.value.trim();
                
                if (text && ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        type: 'message',
                        text: text
                    }));
                    input.value = '';
                }
            }
            
            async function deleteTable() {
                try {
                    const response = await fetch('/temp-chat/stream/1', {
                        method: 'DELETE'
                    });
                    const res = await response.json();

                    if (res.success) {
                        console.log('Temp stream deleted: ' + res.message);
                        location.reload();
                    } else {
                        alert('Error: ' + res.message);
                    }
                } catch (error) {
                    console.error('Error deleting temp stream', error);
                    alert('Error al conectar server');
                }
            }
            
            function addMessage(alias, text, type, timestamp = new Date().toLocaleTimeString()) {
                const messagesDiv = document.getElementById('messages');
                const messageDiv = document.createElement('div');
                messageDiv.className = 'message';
                
                if (type === 'message') {
                    messageDiv.innerHTML = '<span class="timestamp">[' + timestamp + ']</span> ' +
                                          '<span class="user">' + alias + ':</span> ' + text;
                } else {
                    // user_joined, user_left, system
                    messageDiv.innerHTML = '<span class="timestamp">[' + timestamp + ']</span> ' +
                                          '<span class="system">' + text + '</span>';
                }
                
                messagesDiv.appendChild(messageDiv);
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            }
            
            document.addEventListener('DOMContentLoaded', function() {
                document.getElementById('sendButton').addEventListener('click', sendMessage);
                document.getElementById('deleteButton').addEventListener('click', deleteTable);
                
                document.getElementById('messageInput').addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') sendMessage();
                });
                
                connectWebSocket();
            });
        </script>
    </body>
    </html>
  `);
});

fastify.get("/temp-chat/stream/:streamId", { websocket: true }, async (socket, req) => {
  const streamId = (req.params as any).streamId; // CORREGIDO: acceso a params
  
  const alias = `User${Math.floor(Math.random() * 1000)}`;
  const streamIdNum = parseInt(streamId);
  
  try {
    await tempChatService.addClient(socket, alias, streamIdNum);
    
    socket.on("message", (message: Buffer) => { // CORREGIDO: tipo para message
      tempChatService.handleMessage(socket, message.toString());
    });
    
    socket.on("close", () => {
      tempChatService.removeClient(socket);
    });
    
    socket.on("error", (error: Error) => { // CORREGIDO: tipo para error
      console.error("Temp Chat WebSocket error:", error);
      tempChatService.removeClient(socket);
    });
    
  } catch (error: any) {
    console.error(`Error adding client to temp stream ${streamId}:`, error);
    socket.close();
  }
});


fastify.post('/temp-chat/stream', TempChatController.createStream);
fastify.delete('/temp-chat/stream/:streamId', TempChatController.deleteStream);
fastify.get('/temp-chat/health', TempChatController.getHealth);

const start = async () => {
  try {
    await initializeAllModels();
    await fastify.listen({ port: 8082, host: "0.0.0.0" });
    console.log("🚀 Temp Chat WebSocket Server en:");
    console.log("   • HTTPS: https://localhost:8082");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();