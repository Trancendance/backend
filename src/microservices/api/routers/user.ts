import { FastifyPluginAsync } from "fastify";
import userController from '../controllers/user.js';

const userRouter: FastifyPluginAsync = async(fastify, options) => {
    fastify.post('/register', userController.create);
};

export default userRouter;