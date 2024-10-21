module.exports = (sequelize, DataTypes, Model, User, Song) => {
    class SongPlayHistory extends Model {}

    SongPlayHistory.init(
        {
            historyId: {
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
            songId: {
                type: DataTypes.UUID,
                references: {
                    model: Song,
                    key: 'id',
                },
                allowNull: false,
            },
            playtime: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
        },
        {
            sequelize,
            tableName: 'SongPlayHistory',
            modelName: 'SongPlayHistory',
            indexes: [
                {
                    unique: false, // Đảm bảo rằng không có ràng buộc duy nhất
                    fields: ['userId', 'songId'],
                },
            ],
        },
    );

    SongPlayHistory.associate = (models) => {
        SongPlayHistory.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
        SongPlayHistory.belongsTo(models.Song, { foreignKey: 'songId', as: 'song' });
    };

    return SongPlayHistory;
};
