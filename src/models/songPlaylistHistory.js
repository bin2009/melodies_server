'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class SongPlayHistory extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            SongPlayHistory.belongsTo(models.Song, {
                foreignKey: 'songId',
                as: 'song',
            });
            SongPlayHistory.belongsTo(models.User, {
                foreignKey: 'userId',
                as: 'user',
            });
        }
    }
    SongPlayHistory.init(
        {
            historyId: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4,
            },
            userId: {
                type: DataTypes.UUID,
                references: {
                    model: 'User',
                    key: 'id',
                },
                allowNull: false,
            },
            songId: {
                type: DataTypes.UUID,
                references: {
                    model: 'Song',
                    key: 'id',
                },
                allowNull: false,
            },
            playtime: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: 'SongPlayHistory',
            freezeTableName: true,
            indexes: [
                {
                    unique: false, // Ensure no unique constraint
                    fields: ['userId', 'songId'],
                },
            ],
        },
    );
    return SongPlayHistory;
};
