// backend/src/microservices/websocket/server.js
import Fastify from "fastify";
import websocketPlugin from "@fastify/websocket";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

interface ServerResponse {
  players: { id: number; score: number; position: { y: number } }[];
  ball: { x: number; y: number };
}

interface ClientResponse {
  playerId: number;
  positionY: number;
}

class Game {
  protected _staticDefs = {
    width: 800,
    height: 600,
    playerSize: {
      x: 10,
      y: 300,
    },
    playerColor: "blue",
    ballColor: "red",
    ballSize: 20,
  };

  protected _gameState = {
    players: [
      {
        id: 1,
        score: 0,
        position: { x: 50, y: this._staticDefs.height / 2 - 150 },
      },
      {
        id: 2,
        score: 0,
        position: {
          x: this._staticDefs.width - 60,
          y: this._staticDefs.height / 2 - 150,
        },
      },
    ],
    ball: {
      position: {
        x: this._staticDefs.width / 2,
        y: this._staticDefs.height / 2,
      },
      velocity: {
        x: 3,
        y: 3,
      },
    },
  };

  updateState = (): ServerResponse => {
    const newBallPosition = {
      x: this._gameState.ball.position.x + this._gameState.ball.velocity.x,
      y: this._gameState.ball.position.y + this._gameState.ball.velocity.y,
    };

    if (
      newBallPosition.y - this._staticDefs.ballSize < 0 ||
      newBallPosition.y + this._staticDefs.ballSize > this._staticDefs.height
    )
      this._gameState.ball.velocity.y = -this._gameState.ball.velocity.y;

    if (
      newBallPosition.x - this._staticDefs.ballSize < 0 ||
      newBallPosition.x + this._staticDefs.ballSize > this._staticDefs.width
    ) {
      newBallPosition.x = this._staticDefs.width / 2;
      newBallPosition.y = this._staticDefs.height / 2;
      this._gameState.ball.velocity.x = 3 * (Math.random() > 0.5 ? 1 : -1);
      this._gameState.ball.velocity.y = 3 * (Math.random() > 0.5 ? 1 : -1);
    }

    this._gameState.ball.position = newBallPosition;

    return {
      players: this._gameState.players.map((player) => ({
        id: player.id,
        score: player.score,
        position: { y: player.position.y },
      })),
      ball: {
        x: this._gameState.ball.position.x,
        y: this._gameState.ball.position.y,
      },
    };
  };

  listenPlayerMoves = (playerId: number, newY: number) => {
    const player = this._gameState.players.find((p) => p.id === playerId);
    if (player) {
      player.position.y += newY;
      if (player.position.y < 0) player.position.y = 0;
      if (
        player.position.y + this._staticDefs.playerSize.y >
        this._staticDefs.height
      )
        player.position.y =
          this._staticDefs.height - this._staticDefs.playerSize.y;
    }
  };
}

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
const fGame = new Game();

const clients = new Set<any>();
fastify.get("/fgame", { websocket: true }, (socket, req) => {
  console.log("New WebSocket connection established");
  clients.add(socket);
  socket.send(JSON.stringify(fGame.updateState()));
  socket.on("message", (rawMessage: any) => {
    try {
      const { playerId, positionY } = JSON.parse(rawMessage);
      if (playerId && positionY !== undefined) {
        fGame.listenPlayerMoves(playerId, positionY);
      }
    } catch (err) {
      console.error("Invalid JSON:", err);
    }
  });

  socket.on("close", () => {
    clients.delete(socket);
    console.log("Socket closed");
  });

  socket.on("error", (error: any) => {
    console.error("WebSocket error:", error);
  });
});

const start = async () => {
  try {
    await fastify.listen({ port: 8083, host: "0.0.0.0" });
    console.log("🚀 WebSocket fake game server:");
    console.log("HTTPS: https://localhost:8083");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();

setInterval(() => {
  const state = JSON.stringify(fGame.updateState());

  for (const client of clients) {
    try {
      console.log("Sending state to client...");
      client.send(state);
    } catch (err) {
      console.log("Failed to send to a client, removing...");
      clients.delete(client);
    }
  }
}, 1000 / 64);
