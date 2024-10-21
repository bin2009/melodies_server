module.exports = (sequelize, DataTypes, Model, User, Artist) => {
    class Follow extends Model {}

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
                    model: User,
                    key: 'id',
                },
                allowNull: false,
            },
            artistId: {
                type: DataTypes.UUID,
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
            indexes: [
                {
                    unique: false, // Đảm bảo rằng không có ràng buộc duy nhất
                    fields: ['userId', 'artistId'],
                },
            ],
        },
    );

    return Follow;
};
