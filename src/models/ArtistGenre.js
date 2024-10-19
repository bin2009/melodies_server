module.exports = (sequelize, DataTypes, Model, Artist, Genre) => {
    class ArtistGenre extends Model {}

    ArtistGenre.init(
        {
            artistId: {
                type: DataTypes.UUID,
                references: {
                    model: Artist,
                    key: 'id',
                },
                allowNull: false,
            },
            genreId: {
                type: DataTypes.UUID,
                references: {
                    model: Genre,
                    key: 'genreId',
                },
                allowNull: false,
            },
        },
        {
            sequelize,
            tableName: 'ArtistGenre',
            modelName: 'ArtistGenre',
        },
    );

    return ArtistGenre;
};
