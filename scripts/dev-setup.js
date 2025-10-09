import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar entorno de desarrollo local
function setupDevEnvironment() {
  const dataDir = path.join(__dirname, '../../data');
  const certsDir = path.join(__dirname, '../certs');
  
  // Crear directorios necesarios
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('✅ Created data directory:', dataDir);
  }
  
  if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir, { recursive: true });
    console.log('✅ Created certs directory:', certsDir);
  }
  
  // Copiar certificados si no existen (opcional)
  const certSource = path.join(__dirname, '../certs');
  if (fs.existsSync(certSource)) {
    console.log('🔐 Certificates available');
  } else {
    console.log('⚠️  No certificates found. Some features may not work.');
  }
  
  console.log('🎯 Development environment ready!');
  console.log('📁 Data directory:', dataDir);
}

setupDevEnvironment();