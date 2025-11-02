import Fastify, { FastifyRequest, FastifyReply } from 'fastify';

export const singToken = (email: string, reply: FastifyReply) => {
// TODO: Implementar la generación real del JWT
    const token = reply.jwtSign(
        {
            email,
            type: 'magic_link_register'
        },
        {
            expiresIn: '10m'
        }
    );
    return token;//retorna una Promise<string>
};

export const signIn = (email: string, reply: FastifyReply) => {
    const token = reply.jwtSign(
        {
            email,
            type: 'magic_link_login'
        },
        {
            expiresIn: '24h'
        }
    );
    return token;
};

export default { singToken, signIn };