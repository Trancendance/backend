import fastify from "../server.js";
import Fastify, { FastifyRequest, FastifyReply } from 'fastify';

export const singToken = (email:string, reply: FastifyReply) => {
// TODO: Implementar la generación real del JWT
    const token = reply.jwtSign(
    {
        email,
        type: 'magic_link'
    },
    {
        expiresIn: '10m'
    });
    console.log(`token singToken: ${token}`);
    return token;
}
//Crear un token JWT.

// Enviar un correu.

// Fer validacions complexes o transformacions de dades.

export default singToken;