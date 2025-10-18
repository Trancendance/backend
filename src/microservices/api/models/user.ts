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
            console.log("Base de dades ja inizialitzada", tableExists);
            return;
        }
    };

    async create(UserData: {alias: string, first_name: string, last_name: string, email: string, image_path: string/*, creation_date: Date */}) {
            //timestamp calcular aqui
            // const event = new Date(Date.UTC(2012, 11, 20, 3, 0, 0));

            // // British English uses day-month-year order and 24-hour time without AM/PM
            // console.log(event.toLocaleString("en-GB", { timeZone: "UTC" }));
            // // Expected output: "20/12/2012, 03:00:00"
            const db: any = (await import('../../database.js')).default;
            const currentTime = db.prepare(`SELECT CURRENT_TIMESTAMP;`).get();

            //afefgir a la bbdd
    };
}