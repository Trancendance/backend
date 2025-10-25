import { FastifyRequest, FastifyReply } from "fastify";
import User  from "../models/user.js"; // Importa la CLASSE

const userModel = new User(null);

const userController = {
    create: async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const userData = request.body as any;

            console.log('NODE_ENV:', process.env.NODE_ENV);

            // Validacions bàsiques
            if (!userData.alias || !userData.email) {
                return reply.status(400).send({
                    success: false,
                    error: 'Missing required fields: alias, email' 
                });
            }

            // Comprovar si l'alias ja existeix
            const existingAlias = await userModel.getByAlias(userData.alias);
            if (existingAlias) {
                return reply.status(409).send({
                    success: false, 
                    error: 'Alias already in use'
                });
            }

            // Comprovar si l'email ja existeix
            const existingEmail = await userModel.getByEmail(userData.email);
            if (existingEmail) {
                return reply.status(409).send({
                    success: false,
                    error: 'Email already registered'
                });
            }

            await userModel.addPlayer({
                alias: userData.alias,
                first_name: userData.first_name,
                last_name: userData.last_name, 
                email: userData.email,
                image_path: userData.image_path
            });

            reply.send({
                success: true,
                message: 'User registered successfully' 
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