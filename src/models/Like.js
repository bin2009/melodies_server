module.exports = (sequelize, DataTypes, Model, User, Song) => {
    class Like extends Model {}

    Like.init(
        {
            likeId: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            userId: {
                type: DataTypes.UUID,
                references: {
                    model: User,
                    key: 'id',
                },
                allowNull: false,
            },
            songId: {
                type: DataTypes.UUID,
                references: {
                    model: Song,
                    key: 'id',
                },
                allowNull: false,
            },
        },
        {
            sequelize,
            tableName: 'Like',
            modelName: 'Like',
        },
    );

    return Like;
};
