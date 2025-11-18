import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
import { Unverified } from './api/models/unverified_users.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH || '/usr/src/app/data/transcendence.db';

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: process.env.NODE_ENV === 'development' ? console.log: false,
});

import('./api/models/user.js').then(({ Player }) => {
    // Player ya está definido en la importación
    console.log('Player model loaded');
}).catch(console.error);

import('./api/models/unverified_users.js').then(( { Unverified } ) => {
  console.log("unnverified aaaaaaaaaaaaa");
}).catch(console.error);

import('./websocket/models/streamChat.js').then(({ default: StreamChat }) => {
    StreamChat;
    console.log('StreamChat model loaded');
}).catch(console.error);

import('./websocket/models/messageTempChat.js').then(({ default: TempChatMessage }) => {
    TempChatMessage;
    console.log('TempChatMessage model loaded');
}).catch(console.error);

export { sequelize };

export const initializeAllModels = async () => {
  try {
    console.log('Initializing all models...');
    
    // Importar todos los modelos
    const { Player } = await import('./api/models/user.js');
    const { default: StreamChat } = await import('./websocket/models/streamChat.js');
    const { default: TempChatMessage } = await import('./websocket/models/messageTempChat.js');
    
    console.log('All models imported:', {
      Player: !!Player,
      StreamChat: !!StreamChat,
      TempChatMessage: !!TempChatMessage
    });
    
    // Sincronizar todos los modelos
    await sequelize.sync({ force: false });
    console.log('✅ All models synchronized correctly');
    
    return true;
  } catch (error) {
    console.error('❌ Error initializing models:', error);
    throw error;
  }
};