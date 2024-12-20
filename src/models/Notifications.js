'use strict';
const { Model } = require('sequelize');
const { NOTIFICATIONS_TYPE } = require('~/data/enum');
module.exports = (sequelize, DataTypes) => {
    class Notifications extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {}
    }
    Notifications.init(
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
            type: {
                type: DataTypes.ENUM(Object.keys(NOTIFICATIONS_TYPE)),
                allowNull: false,
                defaultValue: 'SYSTEM',
            },
            message: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            isRead: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            from: {
                type: DataTypes.UUID,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: 'Notifications',
            freezeTableName: true,
        },
    );
    return Notifications;
};
