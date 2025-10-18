export class User {
    private db: any;

    constructor(database: any) {
        this.db = database;
        this.checkTable();
    };

    private checkTable() {
        //comprovar si existeix db
        const tableExists = this.db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='player'`).get();

        if (tableExists) {
            console.log("✅ Taula 'player' existeix");
            return true;
        }
        console.log("❌ Taula 'player' NO existeix");
        return false;
    };

    async getByAlias(alias: string) {
        try {
            const stmt = this.db.prepare('SELECT *FROM player WHERE alias = ?');
            return stmt.get(alias);
        } catch (error: any) {
            throw new Error(`Error buscant els alias ${error.message}`);
        }
    };

    async getByEmail(email: string) {
        try {
            const stmt = this.db.prepare('SELECT *FROM player WHERE email = ?');
            return stmt.get(email);
        } catch (error: any) {
            throw new Error(`Error buscant per email: ${error.message}`);
        };
    };

    async create(UserData: {alias: string, first_name: string, last_name: string, email: string, image_path: string}) {
        // const db: any = (await import('../../database.js')).default;
        // const currentTime = db.prepare(`SELECT CURRENT_TIMESTAMP;`).get();
        try {
            //afefgir a la bbdd
            this.db.prepare(`INSERT INTO player(alias, first_name, last_name, email, image_path, creation_date) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`);
        } catch (error: any) {
            throw new Error(`Error creant usuari: ${error.message}`);
        }
    };
}
export default User;