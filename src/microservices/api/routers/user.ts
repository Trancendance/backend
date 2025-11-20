import fastify, { FastifyPluginAsync } from 'fastify';
import userController from '../controllers/user.js';

const userRouter: FastifyPluginAsync = async(fastify, options) => {
    fastify.post('/register', userController.register);
    fastify.post('/registerEndField', userController.chekTokenRegister);
    // fastify.post('/login', userController.login);
    fastify.post('/loginEndField', userController.chekTokenLogin);
};

export default userRouter;