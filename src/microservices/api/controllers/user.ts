import { FastifyRequest, FastifyReply } from "fastify";
import User, { Player }  from "../models/user.js"; // Importa la CLASSE
import UnverifiedPlayerClass, { Unverified } from "../models/unverified_users.js";
import { checkUserExistence, getUserExistenceError } from "./userUtils.js";
import { RegisterInput, registerSchema } from "./userValidation.js";
import { generateUnverifiedToken, generateVerifiedToken, getEmailFromToken} from "../services/auth.js";

const unverifiedModel = new UnverifiedPlayerClass(null);
const playerModel = new User(null);

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
            await unverifiedModel.addUnverifiedPlayer({ ...userData });
            
            const magicLink = await generateMagicLink(userData.email, reply, true);

            //tamber enviar al gmail
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
            //canviar error del 500
            reply.status(500).send(
            {
                success: false, 
                error: error.message
            });
        }
    },
    chekTokenRegister: async(request: FastifyRequest, reply: FastifyReply) => {
        const { token } = request.body as { token: string };
        console.log("ENTRA A chekTokenRegister TOKEN:", token);
        //verifica la expiracio del token, laa dada del token(email)
        const result = await getEmailFromToken(token, request);
    
        if (!result.success) {
            return reply.status(401).send({
                success: false,
                error: result.error
            });
        }
        
        const email = result.email!;
        const playerData = await unverifiedModel.getByEmail(email);
        
        console.log("Player Dataaa:", playerData?.dataValues);
        //afegir a la nova bbdd
        if (!playerData) {
            return reply.status(404).send({
                success: false,
                error: 'Player data not found'
            });
        }
        //borrar de unverified_player el player creat correctament

        await playerModel.addPlayer({ 
            alias: playerData.dataValues.alias,
            email: playerData.dataValues.email,
            image_path: playerData.dataValues.image_path,
        });

        reply.send({
            success: true,
            data: playerData?.dataValues
        });
    },
    login: async(request: FastifyRequest, reply: FastifyReply) => {
        try {
            // 1. existeix envia token i succes, revisar mail ( url: ip/magick linc?token=<jwt token>)
            const { email } = request.body as { email: string };

            const getPlayer: Promise<Unverified | null> = unverifiedModel.getByEmail(email);
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
    },
    chekTokenLogin: async(request: FastifyRequest, reply: FastifyReply) => {
        const { token } = request.body as { token: string };
        console.log("ENTRA A chekTokenLogin TOKEN:", token);
        //DESMONTAR MGICK LINK, cojer tocken despues = 
        //desmontar token i agafar email
        //getemail amb totes les dades
        //afegir les dades a la taula player si el token segueix sent valid si no mostra error 
        //retornar all data de player
    }
};

async function generateMagicLink(email: string, reply: FastifyReply, isRegister: boolean): Promise<string> {
    if (isRegister) {
        const token = await generateUnverifiedToken(email, reply);
        return `https://localhost:3000/magic-link?token=${token}`;
    } else { // login
        const token = await generateVerifiedToken(email, reply);
        return `https://localhost:3000/magic-link?token=${token}`;
    }
}

export default userController;