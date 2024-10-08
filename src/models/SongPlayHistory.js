module.exports = (sequelize, DataTypes, Model, User, Song) => {
    class SongPlayHistory extends Model {}

    SongPlayHistory.init(
        {
            historyId: {
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
            playtime: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
        },
        {
            sequelize,
            tableName: 'SongPlayHistory',
            modelName: 'SongPlayHistory',
        },
    );

    return SongPlayHistory;
};
