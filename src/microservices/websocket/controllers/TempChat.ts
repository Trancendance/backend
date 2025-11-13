import { tempChatService } from '../services/TempChat.js';
interface FastifyRequest {
  params: any;
  body: any;
}

interface FastifyReply {
  send: (data: any) => void;
  status: (code: number) => FastifyReply;
}

export class TempChatController {
  
  static async createStream(request: FastifyRequest, reply: FastifyReply) {
    try {
      const streamId = await tempChatService.createStream();
      return reply.send({ 
        success: true, 
        streamId,
        message: `Stream temporal ${streamId} creado` 
      });
    } catch (error: any) {
      return reply.status(500).send({ 
        success: false, 
        error: 'Error creando stream temporal' 
      });
    }
  }

  static async deleteStream(request: FastifyRequest, reply: FastifyReply) {
    const { streamId } = request.params;
    
    try {
      await tempChatService.deleteStream(parseInt(streamId));
      return reply.send({ 
        success: true, 
        message: `Stream temporal ${streamId} eliminado` 
      });
    } catch (error: any) {
      return reply.status(500).send({ 
        success: false, 
        error: 'Error eliminando stream temporal' 
      });
    }
  }

  static async getHealth(request: FastifyRequest, reply: FastifyReply) {
    const stats = tempChatService.getStats();
    return reply.send({ 
      service: 'Temp Chat WebSocket', 
      status: 'OK',
      connectedClients: stats.clients
    });
  }
}