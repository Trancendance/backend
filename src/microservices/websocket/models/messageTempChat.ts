import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface TemporaryChatMessage {
    message_id: number;
    stream_id: number;
    type: string;
    alias: string;
    text: string;
    timestamp: Date;
}

interface ChatMessageAttributes extends Optional<TemporaryChatMessage, 'message_id' | 'timestamp'>  {}

class TempChatMessage extends Model<TemporaryChatMessage, ChatMessageAttributes> implements TemporaryChatMessage {
    public message_id!: number;
    public stream_id!: number;
    public type!: string;
    public alias!: string;
    public text!: string;
    public timestamp!: Date;
}

TempChatMessage.init(
    {
        message_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        stream_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false
        },
        alias: {
            type: DataTypes.STRING,
            allowNull: false,
            // unique: true
        },
        text: {
            type: DataTypes.STRING,
            allowNull: false
        },
        timestamp: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }   
    },
    {
        sequelize,
        modelName: 'TempChatMessage',
        tableName: 'temp_chat_messages',
        timestamps: false
    }
);

export default TempChatMessage;