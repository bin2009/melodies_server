'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Like extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            Like.belongsTo(models.Song, {
                foreignKey: 'songId',
                as: 'song',
            });
        }
    }
    Like.init(
        {
            likeId: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
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
        },
        {
            sequelize,
            modelName: 'Like',
            freezeTableName: true,
            indexes: [
                {
                    unique: false, // Set to true if you want to ensure unique combinations of userId and songId
                    fields: ['userId', 'songId'],
                },
            ],
        },
    );
    return Like;
};
