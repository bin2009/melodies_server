const { PaymentTypes, PaymentStatus } = require('./enum');

module.exports = (sequelize, DataTypes, Model, User, SubscriptionPackage) => {
    class Subscriptions extends Model {}

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
                    model: User,
                    key: 'id',
                },
                allowNull: false,
            },
            packageId: {
                type: DataTypes.UUID,
                references: {
                    model: SubscriptionPackage,
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
                type: DataTypes.ENUM(Object.values(PaymentTypes)),
                allowNull: false,
            },
            status: {
                type: DataTypes.ENUM(Object.values(PaymentStatus)),
                allowNull: false,
            },
        },
        {
            sequelize,
            tableName: 'Subscriptions',
            modelName: 'Subscriptions',
        },
    );

    return Subscriptions;
};
