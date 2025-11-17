import { WebSocket } from '@fastify/websocket';
import StreamChat from '../models/streamChat.js';
import TempChatMessage from '../models/messageTempChat.js';

interface TempChatClient {
  socket: WebSocket;
  alias: string;
  stream_id: number;
}

interface ChatMessageData {
  type: string;
  alias: string;
  text: string;
  timestamp: string;
}

// Interface para el mensaje de historial
interface HistoryData {
  type: 'history';
  messages: ChatMessageData[];
}

class TempChatService {
  private clients: Map<number, TempChatClient[]> = new Map();

  // Crear nuevo stream temporal
  public async createStream(): Promise<number> {
    const stream = await StreamChat.create({
      active: true
    });
    
    this.clients.set(stream.stream_id, []);
    console.log(`✅ Nuevo stream temporal creado: ${stream.stream_id}`);
    
    return stream.stream_id;
  }

  // Eliminar stream y sus mensajes
  public async deleteStream(streamId: number): Promise<void> {
    // Borrar todos los mensajes del stream
    await TempChatMessage.destroy({
      where: { stream_id: streamId }
    });
    
    // Desactivar stream
    await StreamChat.update(
      { active: false },
      { where: { stream_id: streamId } }
    );
    
    // Desconectar todos los clientes
    const streamClients = this.clients.get(streamId) || [];
    streamClients.forEach(client => {
      client.socket.close();
    });
    
    this.clients.delete(streamId);
    console.log(`🗑️ Stream temporal ${streamId} eliminado`);
  }

  public async addClient(socket: WebSocket, alias: string, streamId: number): Promise<void> {
  console.log(`🔌 [TempChatService] Nuevo cliente: ${alias} al stream ${streamId}`);
  
  try {
    const stream = await StreamChat.findOne({
      where: { stream_id: streamId, active: true }
    });
    
    if (!stream) {
      console.log(`❌ [TempChatService] Stream ${streamId} no existe o está inactivo`);
      socket.close();
      throw new Error(`Stream ${streamId} no existe o está inactivo`);
    }

    console.log(`✅ [TempChatService] Stream ${streamId} encontrado, agregando cliente...`);

    const client: TempChatClient = { socket, alias, stream_id: streamId };
    
    if (!this.clients.has(streamId)) {
      this.clients.set(streamId, []);
    }
    
    this.clients.get(streamId)!.push(client);
    
    console.log(`✅ [TempChatService] ${alias} agregado. Clientes en stream ${streamId}: ${this.clients.get(streamId)!.length}`);
    
    // Enviar historial
    console.log(`📖 [TempChatService] Enviando historial a ${alias}...`);
    await this.sendHistory(client);
    
    // Notificar unión
    console.log(`📢 [TempChatService] Notificando unión de ${alias}...`);
    await this.saveAndBroadcast(streamId, {
      type: 'user_joined',
      alias: 'System',
      text: `${alias} joined the chat`,
      timestamp: new Date().toLocaleTimeString()
    });
    
    console.log(`🎉 [TempChatService] Cliente ${alias} completamente inicializado`);
    
  } catch (error) {
    console.error(`💥 [TempChatService] Error crítico en addClient:`, error);
    throw error;
  }
}

  // Remover cliente
  public removeClient(socket: WebSocket): void {
    for (const [streamId, clients] of this.clients.entries()) {
      const client = clients.find(c => c.socket === socket);
      if (client) {
        this.clients.set(streamId, clients.filter(c => c.socket !== socket));
        
        // Notificar salida
        this.saveAndBroadcast(streamId, {
          type: 'user_left',
          alias: 'System',
          text: `${client.alias} left the chat`,
          timestamp: new Date().toLocaleTimeString()
        });
        
        console.log(`👋 ${client.alias} dejó el stream temporal ${streamId}`);
        break;
      }
    }
  }

  // Manejar mensaje
  public async handleMessage(socket: WebSocket, message: string): Promise<void> {
    try {
      const parsed = JSON.parse(message);
      
      if (parsed.type === "message" && parsed.text?.trim()) {
        const client = this.findClientBySocket(socket);
        if (!client) return;

        await this.saveAndBroadcast(client.stream_id, {
          type: 'message',
          alias: client.alias,
          text: parsed.text.trim(),
          timestamp: new Date().toLocaleTimeString()
        });
        
        console.log(`💬 [Stream ${client.stream_id}] ${client.alias}: ${parsed.text.trim()}`);
      }
    } catch (error) {
      console.error('❌ Error handling temp chat message:', error);
    }
  }

  // Guardar y transmitir mensaje
  private async saveAndBroadcast(streamId: number, messageData: ChatMessageData): Promise<void> {
    // Guardar en BD
    await TempChatMessage.create({
      stream_id: streamId,
      type: messageData.type,
      alias: messageData.alias,
      text: messageData.text,
      timestamp: new Date()
    });
    
    // Transmitir a todos en el stream
    this.broadcastToStream(streamId, messageData);
  }

  // Enviar historial (todos los mensajes en mismo formato)
  private async sendHistory(client: TempChatClient): Promise<void> {
  try {
    console.log(`📚 [sendHistory] Buscando mensajes para stream ${client.stream_id}`);
    
    const recentMessages = await TempChatMessage.findAll({
      where: { stream_id: client.stream_id },
      order: [['timestamp', 'ASC']],
      limit: 50
    });
    
    console.log(`📚 [sendHistory] Encontrados ${recentMessages.length} mensajes`);
    
    const historyData: HistoryData = {
      type: 'history',
      messages: recentMessages.map(msg => ({
        type: msg.type,
        alias: msg.alias,
        text: msg.text,
        timestamp: msg.timestamp.toLocaleTimeString()
      }))
    };
    
    console.log(`📤 [sendHistory] Enviando historial a ${client.alias}...`);
    
    // Verificar que el socket esté abierto
    if (client.socket.readyState === 1) { // OPEN
      client.socket.send(JSON.stringify(historyData));
      console.log(`✅ [sendHistory] Historial enviado exitosamente a ${client.alias}`);
    } else {
      console.log(`❌ [sendHistory] Socket no está abierto para ${client.alias}. Estado: ${client.socket.readyState}`);
      throw new Error(`Socket no está abierto. Estado: ${client.socket.readyState}`);
    }
    
  } catch (error: any) {
    console.error('💥 [sendHistory] Error enviando historial:', error);
    throw error; // Propaga el error para verlo en los logs del servidor
  }
}

  // Broadcast a stream
  private broadcastToStream(streamId: number, message: ChatMessageData): void {
    const clients = this.clients.get(streamId) || [];
    const messageStr = JSON.stringify(message);
    
    clients.forEach(client => {
      try {
        client.socket.send(messageStr);
      } catch (error) {
        this.removeClient(client.socket);
      }
    });
  }

  // Encontrar cliente
  private findClientBySocket(socket: WebSocket): TempChatClient | undefined {
    for (const clients of this.clients.values()) {
      const client = clients.find(c => c.socket === socket);
      if (client) return client;
    }
    return undefined;
  }

  // Estadísticas
  public getStats(streamId?: number): { clients: number } {
    if (streamId) {
      const clients = this.clients.get(streamId) || [];
      return { clients: clients.length };
    }
    
    let totalClients = 0;
    this.clients.forEach(clients => {
      totalClients += clients.length;
    });
    
    return { clients: totalClients };
  }
}

export const tempChatService = new TempChatService();