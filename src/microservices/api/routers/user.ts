// import fastify, { FastifyPluginAsync } from 'fastify';
import fastify, { FastifyPluginAsync } from 'fastify';
import userController from '../controllers/user.js';
import { testEmailConfig, testEmailSend } from '../controllers/testController.js';

const userRouter: FastifyPluginAsync = async(fastify, options) => {
    console.log('🎯 USER ROUTER - Setting up routes...');
    fastify.post('/register', userController.register);
    fastify.post('/registerEndField', userController.chekTokenRegister);
    fastify.post('/login', userController.login);
    fastify.post('/loginEndField', userController.chekTokenLogin);

    fastify.get('/testEmail', testEmailConfig);
    fastify.post('/test-email-send', testEmailSend);
    
    console.log('✅ USER ROUTER - All routes configured');
};

export default userRouter;