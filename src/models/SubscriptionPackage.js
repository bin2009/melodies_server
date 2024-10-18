const { TimePackageTypes, PremiumTypes } = require('./enum');

module.exports = (sequelize, DataTypes, Model) => {
    class SubscriptionPackage extends Model {}

    SubscriptionPackage.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            time: {
                type: DataTypes.ENUM(Object.values(TimePackageTypes)),
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
                type: DataTypes.ENUM(Object.values(PremiumTypes)),
                allowNull: false,
            },
        },
        {
            sequelize,
            tableName: 'SubscriptionPackage',
            modelName: 'SubscriptionPackage',
        },
    );

    return SubscriptionPackage;
};
