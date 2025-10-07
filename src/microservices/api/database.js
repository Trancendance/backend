import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database - RUTA CORREGIDA
const dbPath = '/usr/src/app/data/transcendence.db';
console.log('📁 Database path:', dbPath);

//Declaració de db
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

function initdb() {
  try {
    //comprovar si existeix db
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='player'
    `).get();

    if (tableExists) {
      console.log("Base de dades ja inizialitzada");
      return;
    }

    const dbDocPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(dbDocPath, 'utf8');//llegir arxiu sql
    db.exec(sql);
    console.log("basse de dades s'executa");
    console.log('🔍 Database file exists:', fs.existsSync(dbPath));
    console.log('🔍 Schema file exists:', fs.existsSync(path.join(__dirname, 'schema.sql')));
  } catch (error) {
    console.log("ERROR db no s'executa: ", error);
    throw error;
  }
};

await initdb();

export default db;