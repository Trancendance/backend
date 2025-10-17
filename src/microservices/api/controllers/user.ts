import { FastifyRequest, FastifyReply } from "fastify";
import userRouter from "../routers/user";
import userModel from "../models/user";

const userCOntroller = {
    create: async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const userData = request.body as any;
            
            //timestamp calcular al backend
            console.log(`Dades usuari: ${userData}`);
            
            return {
                success: true,
                massege: "dades en porsses",
                user: userData
            };
        } catch (error: any) {
            reply.status(500).send(
            {
                success: false, 
                error: error.message 
            });
        }
    }
};

export default userCOntroller;