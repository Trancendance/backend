import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

//es per TypeScript, per donar-te seguretat de tipus i autocompletat.
interface PlayerAtributes {
    id: number;
    alias: string;
    email: string;
    image_path: string;
    creation_date: Date;
    status: number;
};

interface PlayerCreationAtributes extends Optional<PlayerAtributes, 'id' | 'creation_date' | 'status'> {};

// cada instància de Player tindrà aquestes propietats, sense la interficie, TS no sabria que hi ha dins de player tot seria any
// El ! definitive assignment assertion de TypeScript
// Li estàs dient al compilador: “Confia en mi, aquest atribut segur que estarà definit en temps d’execució, encara que no el vegis inicialitzat ara.
class Player extends Model<PlayerAtributes, PlayerCreationAtributes> implements PlayerAtributes {
    public id!: number;
    public alias!: string;
    public email!: string;
    public image_path!: string;
    public creation_date!: Date;
    public status!: number;
};

Player.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        alias: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        image_path: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: '../../public/assets/img/default.png'
        },
        creation_date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        status: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        }
    },
    {
        sequelize,
        modelName: 'Player',
        tableName: 'player',
        timestamps: false
    }
);

class User {
    private db: any;

    constructor(database: any) {
        this.db = database;
    };

    // async getAllAliasStatusActive(): Promise<Player | null> {
    //     return Player.findAll({
    //         where: {
    //             status: 'active'
    //         }
    //     });
    // }

    async getByAlias(alias: string): Promise<Player | null> {
       return Player.findOne({ where: { alias } });
    }
    
    async getByEmail(email: string): Promise<Player | null> {
        return Player.findOne({ where: { email } });
    }

    async addPlayer(data: { alias: string; email: string; image_path?: string;
        }): Promise<Player> {
            return Player.create({ alias: data.alias, email: data.email,
                image_path: data.image_path || '../../public/assets/img/default.png',

            });
        }
};

export { Player };
export default User;