export class User {
    private db: any;

    constructor(database: any) {
        this.db = database;
        this.checkTable();
    };

    private checkTable() {
        //comprovar si existeix db
        const tableExists = this.db.prepare(`SELECT * FROM sqlite_master WHERE type='table' AND name='player'`).get();

        if (tableExists) {
            console.log("✅ Taula 'player' existeix", tableExists);
            return true;
        }
        console.log("❌ Taula 'player' NO existeix");
        return false;
    };

    async getByAlias(alias: string) {
        console.log("Model getByAlias");
        try {
            const stmt = this.db.prepare('SELECT *FROM player WHERE alias = ?');
            return stmt.get(alias);
        } catch (error: any) {
            throw new Error(`Error buscant els alias ${error.message}`);
        }
    };

    async getByEmail(email: string) {
        console.log("Model getByEmail");
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
        console.log("Model create");
        try {
            //afefgir a la bbdd
            const stmt = this.db.prepare(`INSERT INTO player(alias, first_name, last_name, email, image_path, creation_date) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`);
            stmt.run(UserData.alias, UserData.first_name, UserData.last_name, UserData.email, UserData.image_path);
        } catch (error: any) {
            throw new Error(`Error creant usuari: ${error.message}`);
        }
    };
}
export default User;