module.exports = (sequelize, DataTypes, Model, User, Song) => {
    class Comment extends Model {}

    Comment.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            commentParentId: {
                type: DataTypes.INTEGER,
                allowNull: true,
                defaultValue: null,
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
            content: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            hide: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
            },
        },
        {
            sequelize,
            tableName: 'Comment',
            modelName: 'Comment',
        },
    );

    return Comment;
};
