'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Follow extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    }
    Follow.init(
        {
            followerId: {
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
            artistId: {
                type: DataTypes.UUID,
                references: {
                    model: 'Artist',
                    key: 'id',
                },
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: 'Follow',
            indexes: [
                {
                    unique: false,
                    fields: ['userId', 'artistId'],
                },
            ],
        },
    );
    return Follow;
};
