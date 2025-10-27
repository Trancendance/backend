import { FastifyPluginAsync } from "fastify";
import userController from '../controllers/user.js';

const userRouter: FastifyPluginAsync = async(fastify, options) => {
    fastify.post('/register', userController.create);//existe alias en la lista 
    // 1. existe alias i/o email (error), revisar els dos i enviar quin si i quin no
    // 2. no existeix ni mail ni alias, crea -> enviar data: link con jwt (url: ip/magick linc?token=<jwt token> ) status:succes
    
    //login mira a la llista 
    // 1. existeix envia token i succes, revisar mail ( url: ip/magick linc?token=<jwt token>)
    // 2. no existe (error)

    //resposta estructura error: data: status:(success o error) message: (quan error) usser existe
};

export default userRouter;