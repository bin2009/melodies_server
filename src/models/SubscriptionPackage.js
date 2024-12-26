'use strict';
const { Model } = require('sequelize');
const { PACKAGE_TIME } = require('~/data/enum');
module.exports = (sequelize, DataTypes) => {
    class SubscriptionPackage extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            SubscriptionPackage.belongsToMany(models.User, {
                through: 'Subscriptions',
                as: 'user',
                foreignKey: 'packageId',
                otherKey: 'userId',
            });
            SubscriptionPackage.hasMany(models.Subscriptions, {
                foreignKey: 'packageId',
                as: 'subs',
            });
        }
    }
    SubscriptionPackage.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4,
            },
            time: {
                type: DataTypes.ENUM(Object.values(PACKAGE_TIME)),
                allowNull: false,
            },
            fare: {
                type: DataTypes.FLOAT,
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            downloads: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            uploads: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            room: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'Package',
            },
        },
        {
            sequelize,
            modelName: 'SubscriptionPackage',
            freezeTableName: true,
        },
    );
    return SubscriptionPackage;
};
