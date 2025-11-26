// magicLinkService.ts
import { FastifyReply } from "fastify";
import { generateUnverifiedToken, generateVerifiedToken } from "./auth.js";
import { emailService } from "./emailService.js";

// export class MagicLinkService {
//   static async generateMagicLink(
//     email: string, 
//     reply: FastifyReply, 
//     isRegister: boolean
//   ): Promise<string> {
//     const token = isRegister 
//       ? await generateUnverifiedToken(email, reply)
//       : await generateVerifiedToken(email, reply);
    
//     return `https://localhost:3000/magic-link?token=${token}`;
//   }
// }

export class MagicLinkService {
  static async generateMagicLink(
    email: string, 
    reply: FastifyReply, 
    isRegister: boolean
  ): Promise<string> {
    try {
      const token = isRegister 
        ? await generateUnverifiedToken(email, reply)
        : await generateVerifiedToken(email, reply);
      
      const magicLink = `http://localhost:3000/magic-link?token=${token}`;
      
      // Enviar el email con el magic link
      const emailSent = await emailService.sendMagicLink(email, magicLink, isRegister);
      
      if (!emailSent) {
        throw new Error('Failed to send magic link email');
      }
      
      return magicLink;
      
    } catch (error) {
      console.error('Error in generateMagicLink:', error);
      throw error;
    }
  }
}