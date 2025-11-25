import { FastifyRequest, FastifyReply } from "fastify";
import User, { Player }  from "../models/user.js"; // Importa la CLASSE
import UnverifiedPlayerClass, { Unverified } from "../models/unverified_users.js";
import { checkUserExistence, getUserExistenceError } from "./userUtils.js";
import { RegisterInput, registerSchema } from "./userValidation.js";
import { getEmailFromToken } from "../services/auth.js";
import { ResponseHandler } from "../services/responseHandeler.js";
import { MagicLinkService } from "./magicLink.js";

const unverifiedModel = new UnverifiedPlayerClass(null);
const playerModel = new User(null);

const userController = {
    register: async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            // Validate input data
            const userData = await registerSchema.validate(request.body as any, {
                abortEarly: false,
                stripUnknown: true // Elimina campos no definidos en el schema
            }) as RegisterInput;//correu no es valid pq ningu te aquest correu

            // Validate input data
            const existence = await checkUserExistence(userData.alias, userData.email);
            const existenceError = getUserExistenceError(existence);

            if (existenceError) {
                return ResponseHandler.sendConflict(reply, existenceError);
            }

            // Create unverified user and generate magic link
            await unverifiedModel.addUnverifiedPlayer({ ...userData });
            const magicLink = await MagicLinkService.generateMagicLink(userData.email, reply, true);

            // Send success response
            ResponseHandler.sendSuccess(reply, { magic_link: magicLink }, 'Magic link sent successfully');
        } catch (error: any) {
            if (error.name === 'ValidationError') {
                ResponseHandler.sendValidationError(reply, error);
            } else {
                ResponseHandler.sendInternalError(reply, error);
            }
        }
    },
    chekTokenRegister: async(request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { token } = request.body as { token: string };

            // Verify token and get email
            const result = await getEmailFromToken(token, request);
            if (!result.success) {
                return ResponseHandler.sendUnauthorized(reply, result.error);
            }
            
            const email = result.email!;
            
            // Get unverified player data
            const playerUnverData = await unverifiedModel.getByEmail(email);
            if (!playerUnverData) {
                return ResponseHandler.sendNotFound(reply, 'Player data');
            }
        
            // Migrate to verified players
            await playerModel.addPlayer({ 
                alias: playerUnverData.dataValues.alias,
                email: playerUnverData.dataValues.email,
                image_path: playerUnverData.dataValues.image_path,
            });

            // Cleanup and update status
            await unverifiedModel.deleteUnverifiedPlayer(email);
            await playerModel.changeStatus(email, 1);
            
            // Get final player data
            const finalPlayer = await playerModel.getByEmail(email);

            ResponseHandler.sendSuccess(reply, finalPlayer, 'Registration completed successfully');
        } catch (error: any) {
            ResponseHandler.sendInternalError(reply, error);
        }
    },
    login: async(request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { email } = request.body as { email: string };

            // Check if user exists
            const player = await playerModel.getByEmail(email);
            if (!player) {
                return ResponseHandler.sendNotFound(reply, `User with email ${email}`);
            }
            
            // El email siempre debería coincidir si lo buscaste por email
            if (player.dataValues.email === email)
            {
                // Generate magic link for login
                const magicLink = await MagicLinkService.generateMagicLink(email, reply, false);
                
                ResponseHandler.sendSuccess(reply, { magic_link: magicLink }, 'Magic link sent successfully');
            } else {
                ResponseHandler.sendNotFound(reply, email);
            }
        } catch (error: any){
            ResponseHandler.sendInternalError(reply, error);
        }
    },
    chekTokenLogin: async(request: FastifyRequest, reply: FastifyReply) => {
        try {
      const { token } = request.body as { token: string };
      
      // Verify token
      const result = await getEmailFromToken(token, request);
      if (!result.success) {
        return ResponseHandler.sendUnauthorized(reply, result.error);
      }
      
      const email = result.email!;
      
      // Get player data and update status
      const playerData = await playerModel.getByEmail(email);
      await playerModel.changeStatus(email, 1);
      
      ResponseHandler.sendSuccess(reply, playerData?.dataValues, 'Login successful');
      
    } catch (error: any) {
      ResponseHandler.sendInternalError(reply, error);
    }
    }
};

export default userController;