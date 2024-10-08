module.exports = (sequelize, DataTypes, Model, User, Artist) => {
    class Follow extends Model {}

    Follow.init(
        {
            followerId: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            userId: {
                type: DataTypes.INTEGER,
                references: {
                    model: User,
                    key: 'id',
                },
                allowNull: false,
            },
            artistId: {
                type: DataTypes.INTEGER,
                references: {
                    model: Artist,
                    key: 'id',
                },
                allowNull: false,
            },
        },
        {
            sequelize,
            tableName: 'Follow',
            modelName: 'Follow',
        },
    );
    return Follow;
};
