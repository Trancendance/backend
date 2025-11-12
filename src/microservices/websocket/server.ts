// backend/src/microservices/websocket/server.js
import Fastify from "fastify";
import websocketPlugin from "@fastify/websocket";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chatService } from './tmpChat.js';

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

fastify.get("/", async (req, reply) => {
  const stats = chatService.getStats();
  
  reply.type('text/html').send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>WebSocket Chat Server</title>
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
        </style>
    </head>
    <body>
        <div class="container">
            <h1>WebSocket Chat Server</h1>
            
            <div class="stats">
                <p><strong>Port:</strong> 8082</p>
                <p><strong>Service Status:</strong> ✅ Running</p>
                <p><strong>Connected Clients:</strong> ${stats.clients}</p>
            </div>

            <div class="chat-container">
                <h3>Live Chat Test</h3>
                <div id="messages"></div>
                <div>
                    <input type="text" id="messageInput" placeholder="Type your message...">
                    <button id="sendButton">Send</button>
                    <button id="deleteButton">Delete</button>
                </div>
            </div>
        </div>

        <script>
            let ws;
            let currentUser = 'User' + Math.floor(Math.random() * 1000);
            
            function connectWebSocket() {
                ws = new WebSocket('wss://localhost:8082/chat');
                
                ws.onopen = function() {
                    console.log('✅ Connected to chat server');
                    addMessage('System', 'Connected to chat as ' + currentUser, 'system');
                };
                
                ws.onmessage = function(event) {
                    const data = JSON.parse(event.data);
                    
                    if (data.type === 'history') {
                        // Clear existing messages
                        document.getElementById('messages').innerHTML = '';
                        
                        // Display message history
                        data.messages.forEach(msg => {
                            addMessage(msg.user_alias, msg.message_text, 'message', msg.timestamp);
                        });
                    } else if (data.type === 'message') {
                        addMessage(data.user, data.text, 'message', data.timestamp);
                    } else if (data.type === 'user_joined') {
                        addMessage('System', data.user + ' joined the chat', 'system');
                    } else if (data.type === 'user_left') {
                        addMessage('System', data.user + ' left the chat', 'system');
                    }
                };
                
                ws.onclose = function() {
                    addMessage('System', 'Disconnected from chat', 'system');
                    // Try to reconnect after 3 seconds
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
                    const response = await fetch('/chat/delete', {
                        method: 'DELETE'
                    });
                    const res = await response.json();

                    if (res.success) {
                        console.log('Table deleted: ' + res.message);
                        location.reload();
                    } else {
                        alert('Error: ' + res.message);
                    }
                } catch (error) {
                    console.error('Error deleting table', error);
                    alert('Error al conectar server');
                }
            }
            
            function addMessage(user, text, type, timestamp = new Date().toLocaleTimeString()) {
                const messagesDiv = document.getElementById('messages');
                const messageDiv = document.createElement('div');
                messageDiv.className = 'message';
                
                if (type === 'message') {
                    messageDiv.innerHTML = '<span class="timestamp">[' + timestamp + ']</span> ' +
                                          '<span class="user">' + user + ':</span> ' + text;
                } else {
                    messageDiv.innerHTML = '<span class="timestamp">[' + timestamp + ']</span> ' +
                                          '<em>' + text + '</em>';
                    messageDiv.style.color = '#666';
                }
                
                messagesDiv.appendChild(messageDiv);
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            }
            
            // Initialize when page loads
            document.addEventListener('DOMContentLoaded', function() {
                // Set up event listeners
                document.getElementById('sendButton').addEventListener('click', sendMessage);
                document.getElementById('deleteButton').addEventListener('click', deleteTable);
                
                document.getElementById('messageInput').addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        sendMessage();
                    }
                });
                
                // Initialize connection when page loads - CORREGIDO: añadido ()
                connectWebSocket();
            });
        </script>
    </body>
    </html>
  `);
});

// Health check endpoint
fastify.get('/ws-health', async (request, reply) => {
  const stats = chatService.getStats();
  reply.send({ 
    service: 'WebSocket Chat', 
    status: 'OK',
    connectedClients: stats.clients
  });
});

// WebSocket chat endpoint
fastify.get("/chat", { websocket: true }, (socket, req) => {
  const user = `User${Math.floor(Math.random() * 1000)}`;
  //cal agafar alias i posar-lo com a usuari 
  
  // Add client to chat service
  chatService.addClient(socket, user);
  
  // Handle incoming messages
  socket.on("message", (message) => {
    chatService.handleMessage(socket, message.toString());
  });
  
  // Handle client disconnection
  socket.on("close", () => {
    chatService.removeClient(socket);
  });
  
  // Handle errors
  socket.on("error", (error) => {
    console.error("WebSocket error:", error);
    chatService.removeClient(socket);
  });
});

fastify.delete("/chat/delete", async (request, reply) => {
    try {
        chatService.deleteTable();

        reply.send({
            success: true,
            message: "table dropped",
        });
    } catch (err) {
        console.error("ERROR: ", err, " in /chat/delete");
        reply.status(500).send({
            success: false,
            message: "error al borrar table"
        });
    }
});

const start = async () => {
  try {
    await fastify.listen({ port: 8082, host: "0.0.0.0" });
    console.log("🚀 WebSocket Chat Server en:");
    console.log("   • HTTPS: https://localhost:8082");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();