module.exports = (sequelize, DataTypes, Model, Playlist, Song) => {
    class PlaylistSong extends Model {}

    PlaylistSong.init(
        {
            playlistId: {
                type: DataTypes.INTEGER,
                references: {
                    model: Playlist,
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
            tableName: 'PlaylistSong',
            modelName: 'PlaylistSong',
        },
    );
    return PlaylistSong;
};
