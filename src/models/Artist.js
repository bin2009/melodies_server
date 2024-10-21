module.exports = (sequelize, DataTypes, Model) => {
    class Artist extends Model {}

    Artist.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: DataTypes.UUIDV4,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            avatar: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            bio: {
                type: DataTypes.TEXT,
            },
        },
        {
            sequelize,
            tableName: 'Artist',
            modelName: 'Artist',
        },
    );

    Artist.associate = (models) => {
        Artist.belongsToMany(models.Song, {
            through: 'ArtistSong',
            as: 'songs',
            foreignKey: 'artistId',
            otherKey: 'songId',
        });
        Artist.belongsToMany(models.Genre, {
            through: 'ArtistGenre',
            as: 'genres',
            foreignKey: 'artistId',
            otherKey: 'genreId',
        });
        Artist.belongsToMany(models.User, {
            through: 'Follow',
            as: 'followers',
            foreignKey: 'artistId',
            otherKey: 'userId',
        });
    };

    return Artist;
};
