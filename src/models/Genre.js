module.exports = (sequelize, DataTypes, Model) => {
    class Genre extends Model {}

    Genre.init(
        {
            genreId: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
        },
        {
            sequelize,
            tableName: 'Genre',
            modelName: 'Genre',
        },
    );

    Genre.associate = (models) => {
        Genre.belongsToMany(models.Artist, {
            through: 'ArtistGenre',
            as: 'artists',
            foreignKey: 'genreId',
            otherKey: 'artistId',
        });
    };

    return Genre;
};
