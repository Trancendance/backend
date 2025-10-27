import { FastifyRequest, FastifyReply } from "fastify";
import User  from "../models/user.js"; // Importa la CLASSE
import { error } from "console";
import { checkUserExistence, getUserExistenceError } from "./userUtils.js";
import { RegisterInput, registerSchema } from "./userValidation.js";

const userModel = new User(null);

const userController = {
    register: async (request: FastifyRequest, reply: FastifyReply) => {
    // 1. existe alias i/o email (error), revisar els dos i enviar quin si i quin no. FET
    // 2. no existeix ni mail ni alias, crea -> enviar data: link con jwt (url: ip/magick linc?token=<jwt token> ) status:succes
    //resposta estructura error: data: status:(success o error) message: (quan error) usser existe
        try {
            const userData = await registerSchema.validate(request.body as any, {
                abortEarly: false,
                stripUnknown: true // Elimina campos no definidos en el schema
            }) as RegisterInput;//correu no es valid pq ningu te aquest correu
            
            const existence = await checkUserExistence(userData.alias, userData.email);
            const existenceError = getUserExistenceError(existence);

            if (existenceError)
            {
                return reply.status(409).send({
                    success: false,
                    message: existenceError
                });
            }

            //crea -> enviar data: link con jwt (url: ip/magick link?token=<jwt token> ) status:succes
            await userModel.addPlayer({
                alias: userData.alias,
                first_name: userData.first_name || null,
                last_name: userData.last_name || null, 
                email: userData.email,
                image_path: userData.image_path
            });

            const magicLink = await generateMagicLink(userData.email);

            reply.send({
                success: true,
                message: 'Magic link sent successfully',
                data: {
                magic_link: magicLink
                }
            });
        } catch (error: any) {
            if (error.name === 'ValidationError') {
                return reply.status(400).send({
                success: false,
                error: 'Validation failed',
                details: error.errors
                });
            }
            reply.status(500).send(
            {
                success: false, 
                error: error.message 
            });
        }
    }
    // login: async(request: FastifyRequest, reply: FastifyReply) => {
    // // 1. existeix envia token i succes, revisar mail ( url: ip/magick linc?token=<jwt token>)
    // // 2. no existe (error)
    // //resposta estructura error: data: status:(success o error) message: (quan error) usser existe
    // }
};

async function generateMagicLink(email: string): Promise<string> {
  // TODO: Implementar la generación real del JWT
  // Por ejemplo:
  // const token = await reply.jwtSign({ email }, { expiresIn: '15m' });
  // return `http://yourapp.com/magic-link?token=${token}`;
  
  return `http://localhost:3000/magic-link?token=placeholder_jwt_token_for_${email}`;
}

export default userController;