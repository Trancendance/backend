import { FastifyRequest, FastifyReply } from "fastify";
import userRouter from "../routers/user";
import userModel from "../models/user";

const userCOntroller = {
    create: async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const userData = request.body as any;
            // Validacions bàsiques 
            // alieas sigui unic getusername bbdd
            // que el correu sigui real gmail getgmail(); bbdd

            //timestamp calcular aqui
            // const event = new Date(Date.UTC(2012, 11, 20, 3, 0, 0));

            // // British English uses day-month-year order and 24-hour time without AM/PM
            // console.log(event.toLocaleString("en-GB", { timeZone: "UTC" }));
            // // Expected output: "20/12/2012, 03:00:00"
            const db: any = (await import('../../database.js')).default;
            const currentTime = db.prepare(`SELECT CURRENT_TIMESTAMP;`).get();

            console.log(`Dades usuari: ${userData}\nCURRENTTIME: ${currentTime}`);
            
            return {
                success: true,
                massege: "dades en porsses",
                user: userData,
                current_time: currentTime
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