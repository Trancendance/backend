import { FastifyRequest, FastifyReply } from "fastify";
// import userRouter from "../routers/user";
import { User } from "../models/user.js"; // Importa la CLASSE
const db: any = (await import('../../database.js')).default;
const userModel = new User(db); // Crea una INSTÀNCIA

const userController = {
    create: async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const userData = request.body as any;

            // Validacions bàsiques
            if (!userData.alias || !userData.first_name || !userData.last_name || !userData.email) {
                return reply.status(400).send({
                    success: false,
                    error: 'Falten camps obligatoris: alias, first_name, last_name, email'
                });
            }

            //comprovar que si alies ja existeix
            const existingAlias = await userModel.getByAlias(userData.alias);
            if (existingAlias) {
                return reply.status(409).send({
                    success: false, 
                    error: 'Aquest àlies ja està en ús'
                });
            }

             // Comprovar si l'email ja existeix
            const existingEmail = await userModel.getByEmail(userData.email);
            if (existingEmail) {
                return reply.status(409).send({
                    success: false,
                    error: 'Aquest email ja està registrat'
                });
            }

            await userModel.create({
                alias: userData.alias,
                first_name: userData.first_name,
                last_name: userData.last_name, 
                email: userData.email,
                image_path: userData.image_path
            });
            
        } catch (error: any) {
            reply.status(500).send(
            {
                success: false, 
                error: error.message 
            });
        }
    }
};

export default userController;