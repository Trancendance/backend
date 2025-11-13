import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../sequelize.js';

interface StreamChatAttributes {
  stream_id: number;
  created_at: Date;
  active: boolean;
}

interface StreamChatCreationAtributes extends Optional<StreamChatAttributes, 'stream_id' | 'created_at'> {}

class StreamChat extends Model<StreamChatAttributes, StreamChatCreationAtributes> implements StreamChatAttributes {
  public stream_id!: number;
  public created_at!: Date;
  public active!: boolean;
}

StreamChat.init(
    {
        stream_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }
    },
    {
      sequelize,
      modelName: 'StreamChat',
      tableName: 'stream_chat',
      timestamps: false
    }
);

export default StreamChat;