'use strict';
const { Model } = require('sequelize');
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
                through: 'Subscription',
                as: 'users',
                foreignKey: 'packageId',
                otherKey: 'userId',
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
                type: DataTypes.ENUM('Monthly', 'Yearly'),
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
            type: {
                type: DataTypes.ENUM('Basic', 'Premium'),
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: 'SubscriptionPackage',
        },
    );
    return SubscriptionPackage;
};
