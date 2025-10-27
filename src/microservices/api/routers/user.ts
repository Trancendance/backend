import { FastifyPluginAsync } from "fastify";
import userController from '../controllers/user.js';

const userRouter: FastifyPluginAsync = async(fastify, options) => {
    fastify.post('/register', userController.register);
    // fastify.post('/login', userController.login);
};

export default userRouter;