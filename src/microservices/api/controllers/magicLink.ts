// magicLinkService.ts
import { FastifyReply } from "fastify";
import { generateUnverifiedToken, generateVerifiedToken } from "../services/auth.js";

export class MagicLinkService {
  static async generateMagicLink(
    email: string, 
    reply: FastifyReply, 
    isRegister: boolean
  ): Promise<string> {
    const token = isRegister 
      ? await generateUnverifiedToken(email, reply)
      : await generateVerifiedToken(email, reply);
    
    return `https://localhost:3000/magic-link?token=${token}`;
  }
}