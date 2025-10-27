import { Player } from './user.js';
import { sequelize } from '../../sequelize.js';

export { Player, sequelize };

// Función para inicializar todos los modelos
export const initializeModels = async () => {
  try {
    // Importar y inicializar todos los modelos aquí
    console.log('Inisialaizing models...');
    
    // Verificar que el modelo Player está correctamente definido
    console.log('Player Model defined:', Player === sequelize.models.Player);
    
    // Sincronizar
    await sequelize.sync({ force: false });
    console.log(' :) Models sincronized correctli');
    
    return true;
  } catch (error) {
    console.error('Error init models:', error);
    throw error;
  }
};
