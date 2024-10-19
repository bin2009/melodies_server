module.exports = (sequelize, DataTypes, Model, Playlist, Song) => {
    class PlaylistSong extends Model {}

    PlaylistSong.init(
        {
            playlistId: {
                type: DataTypes.UUID,
                references: {
                    model: Playlist,
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
            tableName: 'PlaylistSong',
            modelName: 'PlaylistSong',
        },
    );
    return PlaylistSong;
};
