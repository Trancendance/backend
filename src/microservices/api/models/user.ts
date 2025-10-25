import { DataTypes, IntegerDataType, Model, Optional, Sequelize } from 'sequelize';
import { sequelize } from '../../sequelize.js';

//es per TypeScript, per donar-te seguretat de tipus i autocompletat.
interface PlayerAtributes {
    player_id: number;
    alias: string;
    first_name: string;
    last_name: string;
    email: string;
    image_path: string;
    creation_date: Date;
    status: number;
    active: boolean;
};

interface PlayerCreationAtributes extends Optional<PlayerAtributes, 'player_id'
| 'first_name' | 'last_name' | 'image_path' | 'creation_date' | 'status' | 'active'> {};

// cada instància de Player tindrà aquestes propietats, sense la interficie, TS no sabria que hi ha dins de player tot seria any
// El ! definitive assignment assertion de TypeScript
// Li estàs dient al compilador: “Confia en mi, aquest atribut segur que estarà definit en temps d’execució, encara que no el vegis inicialitzat ara.
class Player extends Model<PlayerAtributes, PlayerCreationAtributes> implements PlayerAtributes {
    public player_id!: number;
    public alias!: string;
    public first_name!: string;
    public last_name!: string;
    public email!: string;
    public image_path!: string;
    public creation_date!: Date;
    public status!: number;
    public active!: boolean;
};

Player.init(
    {
        player_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        alias: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        first_name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        last_name: {
            type: DataTypes.STRING,
            allowNull: true
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
        },
        active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
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

    async getByAlias(alias: string): Promise<Player | null> {
       return Player.findOne({ where: { alias } });
    }
    
    async getByEmail(email: string): Promise<Player | null> {
        return Player.findOne({ where: { email } });
    }

    async addPlayer(data: { alias: string; first_name: string; last_name: string;
        email: string; image_path?: string;
        }): Promise<Player> {
            return Player.create({ alias: data.alias, first_name: data.first_name,
                last_name: data.last_name, email: data.email,
                image_path: data.image_path || '../../public/assets/img/default.png',

            });
        }
};

export { Player };
export default User;