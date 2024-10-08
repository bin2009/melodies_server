module.exports = (sequelize, DataTypes, Model, Song, Artist) => {
    class ArtistSong extends Model {}

    ArtistSong.init(
        {
            songId: {
                type: DataTypes.INTEGER,
                references: {
                    model: Song,
                    key: 'id',
                },
                allowNull: true,
            },
            artistId: {
                type: DataTypes.INTEGER,
                references: {
                    model: Artist,
                    key: 'id',
                },
                allowNull: true,
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
