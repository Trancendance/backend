import { FastifyRequest, FastifyReply } from "fastify";
import User, { Player }  from "../models/user.js"; // Importa la CLASSE
import { error } from "console";
import { checkUserExistence, getUserExistenceError } from "./userUtils.js";
import { RegisterInput, registerSchema } from "./userValidation.js";
import { singToken, signIn } from "../services/auth.js";

const userModel = new User(null);

const userController = {
    register: async (request: FastifyRequest, reply: FastifyReply) => {
    // 1. existe alias i/o email (error), revisar els dos i enviar quin si i quin no. FET
    // 2. no existeix ni mail ni alias, crea -> enviar data: link con jwt (url: ip/magick linc?token=<jwt token> ) status:succes
    //resposta estructura error: data: status:(success o error) message: (quan error) usser existe
        try {
            //validacions de que les dades que envien son correctes
            const userData = await registerSchema.validate(request.body as any, {
                abortEarly: false,
                stripUnknown: true // Elimina campos no definidos en el schema
            }) as RegisterInput;//correu no es valid pq ningu te aquest correu
            
            //validacio de que les  dades alies i gmail no estan ja a la bbdd d'un atre usuari
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
                first_name: userData.first_name!,
                last_name: userData.last_name!,
                email: userData.email,
                image_path: userData.image_path
            });

            const magicLink = await generateMagicLink(userData.email, reply, true);

            reply.send({
                success: true,
                message: 'Magic link sent successfully',
                data: {
                    magic_link: magicLink
                }
            });
        } catch (error: any) {
            if (error.name === 'ValidationError') {//crec que mai entra aqui
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
    },
    login: async(request: FastifyRequest, reply: FastifyReply) => {
        try {
            // 1. existeix envia token i succes, revisar mail ( url: ip/magick linc?token=<jwt token>)
            const { email } = request.body as { email: string };

            const getPlayer: Promise<Player | null> = userModel.getByEmail(email);
            const player = await getPlayer;
            if (player && player?.email === email)
            {
                const magicLink = await generateMagicLink(email, reply, false);
                reply.send({
                    success: true,
                    message: 'magic link sended',
                    data: magicLink
                });
            }
        } catch (error: any){
            // 2. no existe (error)
            //resposta estructura error: data: status:(success o error) message: (quan error) usser existe
            reply.status(500).send({
                success: false,
                error: error.message
            });
        }
    }
};

async function generateMagicLink(email: string, reply: FastifyReply, isRegister: boolean): Promise<string> {
    if (isRegister) {
        const token = await singToken(email, reply);
        return `https://localhost:3000/magic-link?token=${token}`;
    } else { // login
        const token = await signIn(email, reply);
        return `https://localhost:3000/magic-link?token=${token}`;
    }
}

export default userController;