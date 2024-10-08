module.exports = (sequelize, DataTypes, Model, User, Song) => {
    class Like extends Model {}

    Like.init(
        {
            likeId: {
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
            songId: {
                type: DataTypes.INTEGER,
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
