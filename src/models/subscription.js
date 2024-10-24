'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Subscriptions extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
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
            paymentMethod: {
                type: DataTypes.ENUM('CreditCard', 'PayPal', 'BankTransfer'),
                allowNull: false,
            },
            status: {
                type: DataTypes.ENUM('Pending', 'Active', 'Expired'),
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: 'Subscriptions',
        },
    );
    return Subscriptions;
};
