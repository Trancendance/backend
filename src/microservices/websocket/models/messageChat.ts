import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize';

interface TemporaryChatMessage {
    chat_id: number;
    type: string;
    alias: string;
    text: string;
    timestamp: string;
}

interface ChatMessageAttributes extends Optional<TemporaryChatMessage, 'message_id'> {}