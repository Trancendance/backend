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
    return token;//retorna una Promise<string>
}

export default singToken;