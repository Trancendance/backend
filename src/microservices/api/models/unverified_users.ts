import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface UnverifiedPlayerAtributes {
    id: number;
    alias: string;
    email: string;
    image_path: string;
    creation_date: Date;
    expiration_date: Date;
};
interface UnverifiedAtributes extends Optional<UnverifiedPlayerAtributes, 'id' | 'creation_date' | 'expiration_date'> {};

class Unverified extends Model<UnverifiedPlayerAtributes, UnverifiedAtributes> implements UnverifiedPlayerAtributes {
    public id!: number;
    public alias!: string;
    public email!: string;
    public image_path!: string;
    public creation_date!: Date;
    public expiration_date!: Date;
};

Unverified.init(
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
        expiration_date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: () => new Date(Date.now() + 3 * 60 * 60 * 1000)
        }
    },
    {
        sequelize,
        modelName: 'UnverifiedPlayer',
        tableName: 'unverified_player',
        timestamps: false,
        hooks: {
            beforeCreate: (unverified: Unverified) => {
                console.log('beforeCreate hook executing');
                const now = new Date();
                unverified.creation_date = now;
                // Agregar 3 horas para la expiración
                unverified.expiration_date = new Date(now.getTime() + 3 * 60 * 60 * 1000);
            }
        }
    }
);

class UnverifiedPlayerClass {
    private db: any;

    constructor(database: any) {
        this.db = database;
    };

    async getByAlias(alias: string): Promise<Unverified | null> {
       return Unverified.findOne({ where: { alias } });
    }
    
    async getByEmail(email: string): Promise<Unverified | null> {
        return Unverified.findOne({ where: { email } });
    }

    async addUnverifiedPlayer(data: { 
        alias: string; 
        email: string; 
        image_path?: string;
    }): Promise<Unverified> {
        const now = new Date();
        const expiration = new Date(now.getTime() + 3 * 60 * 60 * 1000);
        console.log("addUnverifiedPlayer expitation date:", expiration);
        return Unverified.create({ 
            alias: data.alias, 
            email: data.email,
            image_path: data.image_path || '../../public/assets/img/default.png'
        });
    }
    async deleteUnverifiedPlayer(email: string): Promise<null> {
        Unverified.destroy({ where: { email }});
        return null;
    }
};
export { Unverified };
export default UnverifiedPlayerClass;