module.exports = (sequelize, DataTypes, Model, Song, Artist) => {
    class ArtistSong extends Model {}

    ArtistSong.init(
        {
            songId: {
                type: DataTypes.UUID,
                references: {
                    model: Song,
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
            main: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
            },
        },
        {
            sequelize,
            tableName: 'ArtistSong',
            modelName: 'ArtistSong',
        },
    );

    return ArtistSong;
};
