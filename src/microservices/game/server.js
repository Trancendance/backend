// backend/src/microservices/game/server.js
import Fastify from "fastify";
import websocketPlugin from "@fastify/websocket";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Certificats HTTPS
const keyPath = path.join(__dirname, "../../../certs/fd_transcendence.key");
const certPath = path.join(__dirname, "../../../certs/fd_transcendence.crt");

const httpsOptions = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
};

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
  https: httpsOptions,
});

await fastify.register(websocketPlugin);

// Game state
let clients = [];
let nextPlayer = 1;
let gameState = {
  ball: { x: 300, y: 200, dx: 4, dy: 4, r: 10 },
  paddles: { left: { y: 150 }, right: { y: 150 } },
  score: { left: 0, right: 0 },
};

// Serve game client
fastify.get("/", async (req, reply) => {
  const htmlPath = path.join(__dirname, "../../public/game.html");
  const htmlContent = fs.readFileSync(htmlPath, "utf8");
  reply.type("text/html").send(htmlContent);
});

fastify.get("/game-health", async (request, reply) => {
  reply.send({ service: "Game", status: "OK" });
});

// Status page
fastify.get("/status", async (req, reply) => {
  reply.type("text/html").send(`
    <html>
      <body>
        <h1> Game Server</h1>
        <p>Puerto: 8080 (HTTPS)</p>
        <p>Servicio funcionando correctamente</p>
        <p>Jugadores conectados: ${clients.length}</p>
        <a href="/">Jugar Pong</a>
      </body>
    </html>
  `);
});

// WebSocket game
fastify.get("/wss", { websocket: true }, (socket, req) => {
  const playerId = nextPlayer <= 2 ? nextPlayer++ : null;
  console.log(`Nuevo jugador: ${playerId ?? "espectador"}`);

  const client = { socket, playerId };
  clients.push(client);

  socket.send(JSON.stringify({ type: "role", player: playerId }));

  socket.on("message", (msg) => {
    try {
      const parsed = JSON.parse(msg.toString());
      if (parsed.type === "move" && client.playerId) {
        const paddle = client.playerId === 1 ? "left" : "right";
        gameState.paddles[paddle].y = Math.max(
          0,
          Math.min(300, gameState.paddles[paddle].y + parsed.dy)
        );
      }
    } catch (e) {
      console.error("Error parsing message", e);
    }
  });

  socket.on("close", () => {
    clients = clients.filter((c) => c.socket !== socket);
    if (playerId) nextPlayer = playerId;
    console.log(`👋 Jugador ${playerId} desconectado`);
  });
});

// Game loop
setInterval(() => {
  if (clients.length >= 2) {
    // Update ball position
    gameState.ball.x += gameState.ball.dx;
    gameState.ball.y += gameState.ball.dy;

    // Ball collision
    if (
      gameState.ball.y - gameState.ball.r < 0 ||
      gameState.ball.y + gameState.ball.r > 400
    ) {
      gameState.ball.dy *= -1;
    }

    // Paddle collision
    if (
      gameState.ball.x - gameState.ball.r < 20 &&
      gameState.ball.y > gameState.paddles.left.y &&
      gameState.ball.y < gameState.paddles.left.y + 100
    ) {
      gameState.ball.dx *= -1.05;
    }
    if (
      gameState.ball.x + gameState.ball.r > 580 &&
      gameState.ball.y > gameState.paddles.right.y &&
      gameState.ball.y < gameState.paddles.right.y + 100
    ) {
      gameState.ball.dx *= -1.05;
    }

    // Score
    if (gameState.ball.x < 0) {
      gameState.score.right++;
      resetBall();
    }
    if (gameState.ball.x > 600) {
      gameState.score.left++;
      resetBall();
    }

    // Broadcast
    const state = JSON.stringify({ type: "state", data: gameState });
    clients.forEach((client) => {
      try {
        client.socket.send(state);
      } catch (e) {
        // Client disconnected
      }
    });
  }
}, 50);

function resetBall() {
  gameState.ball = { x: 300, y: 200, dx: 4, dy: 4, r: 10 };
}

const start = async () => {
  try {
    await fastify.listen({ port: 8080, host: "0.0.0.0" });
    console.log("🚀 Game Server en https://localhost:8080");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
