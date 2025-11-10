import { WebSocket } from '@fastify/websocket';
import db from '../database.js';

// Interface for chat messages
interface ChatMessage {
  type: string;
  user: string;
  text: string;
  timestamp: string;
}

interface ChatClient {
  socket: WebSocket;
  user: string;
}

// Create temporary chat table
function createTempChatTable(): void {
  try {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS temp_chat_messages (
        message_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_alias TEXT NOT NULL,
        message_text TEXT NOT NULL,
        timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    db.exec(createTableSQL);
    console.log('✅ Temporary chat table created/verified');
  } catch (error) {
    console.error('❌ Error creating temp chat table:', error);
  }
}

// Initialize table on module load
createTempChatTable();

class ChatService {
  private clients: ChatClient[] = [];

  // Save message to database
  private saveMessage(user: string, text: string): void {
    try {
      const stmt = db.prepare(`
        INSERT INTO temp_chat_messages (user_alias, message_text) 
        VALUES (?, ?)
      `);
      stmt.run(user, text);
    } catch (error) {
      console.error('❌ Error saving message to database:', error);
    }
  }

  // Get recent messages from database
  private getRecentMessages(limit: number = 50): any[] {
    try {
      const stmt = db.prepare(`
        SELECT user_alias, message_text, timestamp 
        FROM temp_chat_messages 
        ORDER BY timestamp DESC 
        LIMIT ?
      `);
      return stmt.all(limit);
    } catch (error) {
      console.error('❌ Error getting messages from database:', error);
      return [];
    }
  }

  // Add new client to chat
  public addClient(socket: WebSocket, user: string): void {
    const client: ChatClient = { socket, user };
    this.clients.push(client);
    
    console.log(`✅ New chat client connected: ${user}`);
    
    // Send message history to new client (last 50 messages)
    this.sendHistory(client);
    
    // Notify all clients about new user
    this.broadcast({
      type: 'user_joined',
      user: user,
      timestamp: new Date().toLocaleTimeString()
    }, client);
  }

  // Remove client from chat
  public removeClient(socket: WebSocket): void {
    const client = this.clients.find(c => c.socket === socket);
    if (client) {
      this.clients = this.clients.filter(c => c.socket !== socket);
      
      // Notify all clients about user leaving
      this.broadcast({
        type: 'user_left',
        user: client.user,
        timestamp: new Date().toLocaleTimeString()
      });
      
      console.log(`👋 Chat client disconnected: ${client.user}`);
    }
  }

  // Handle incoming message
  public handleMessage(socket: WebSocket, message: string): void {
    try {
      const parsed = JSON.parse(message);
      
      if (parsed.type === "message" && parsed.text?.trim()) {
        const client = this.clients.find(c => c.socket === socket);
        if (!client) return;

        const chatMessage: ChatMessage = {
          type: 'message',
          user: client.user,
          text: parsed.text.trim(),
          timestamp: new Date().toLocaleTimeString()
        };
        
        // Save message to database (NO LIMIT - all messages are saved)
        this.saveMessage(client.user, parsed.text.trim());
        
        // Broadcast to all clients
        this.broadcast(chatMessage);
        
        console.log(`💬 Message from ${client.user}: ${parsed.text.trim()}`);
      }
    } catch (error) {
      console.error('❌ Error handling chat message:', error);
    }
  }

  // Send message history to client (last 50 messages)
  private sendHistory(client: ChatClient): void {
    try {
      const recentMessages = this.getRecentMessages(50);
      const historyMessage = {
        type: 'history',
        messages: recentMessages.reverse() // Show oldest first
      };
      
      client.socket.send(JSON.stringify(historyMessage));
    } catch (error) {
      console.error('❌ Error sending history:', error);
    }
  }

  // Broadcast message to all clients except one
  private broadcast(message: any, excludeClient: ChatClient | null = null): void {
    const messageStr = JSON.stringify(message);
    
    this.clients.forEach(client => {
      if (client !== excludeClient) {
        try {
          client.socket.send(messageStr);
        } catch (error) {
          // Client disconnected, remove it
          this.removeClient(client.socket);
        }
      }
    });
  }

  // Get current chat statistics
  public getStats(): { clients: number } {
    return {
      clients: this.clients.length
    };
  }
}

// Export singleton instance
export const chatService = new ChatService();