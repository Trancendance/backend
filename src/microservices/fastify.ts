import Fastify from "fastify";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Certificats HTTPS
const keyPath = path.join(__dirname, "../../certs/fd_transcendence.key");
const certPath = path.join(__dirname, "../../certs/fd_transcendence.crt");

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

export default fastify;