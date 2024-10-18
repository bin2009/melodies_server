module.exports = (sequelize, DataTypes, Model, Artist, Genre) => {
    class ArtistGenre extends Model {}

    ArtistGenre.init(
        {
            artistId: {
                type: DataTypes.INTEGER,
                references: {
                    model: Artist,
                    key: 'id',
                },
                allowNull: false,
            },
            genreId: {
                type: DataTypes.INTEGER,
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
