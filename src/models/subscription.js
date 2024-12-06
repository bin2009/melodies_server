'use strict';
const { Model } = require('sequelize');
const { PAYMENT } = require('~/data/enum');
module.exports = (sequelize, DataTypes) => {
    class Subscriptions extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            Subscriptions.belongsTo(models.User, {
                foreignKey: 'userId',
                as: 'user',
            });
            Subscriptions.belongsTo(models.SubscriptionPackage, {
                foreignKey: 'packageId',
                as: 'package',
            });
        }
    }
    Subscriptions.init(
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
            packageId: {
                type: DataTypes.UUID,
                references: {
                    model: 'SubscriptionPackage',
                    key: 'id',
                },
                allowNull: false,
            },
            startDate: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            endDate: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            status: {
                type: DataTypes.ENUM(Object.values(PAYMENT)),
                allowNull: false,
            },
            statusUse: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
        },
        {
            sequelize,
            modelName: 'Subscriptions',
            freezeTableName: true,
        },
    );
    return Subscriptions;
};
