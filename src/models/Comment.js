module.exports = (sequelize, DataTypes, Model, User, Song) => {
    class Comment extends Model {}

    Comment.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4,
            },
            commentParentId: {
                type: DataTypes.UUID,
                allowNull: true,
                defaultValue: null,
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
