'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Artist extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
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
        }
    }
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
                allowNull: true,
            },
            followersCount: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: 'Artist',
        },
    );
    return Artist;
};
