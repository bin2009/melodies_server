'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Download extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {}
    }
    Download.init(
        {
            id: {
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
        },
        {
            sequelize,
            modelName: 'Download',
            freezeTableName: true,
            indexes: [
                {
                    unique: false,
                    fields: ['userId', 'songId'],
                },
            ],
        },
    );
    return Download;
};
