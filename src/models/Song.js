'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Song extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            // Song.belongsTo(models.Album, { foreignKey: 'albumId', as: 'album' });
            Song.belongsToMany(models.Album, {
                through: 'AlbumSong',
                as: 'album',
                foreignKey: 'songId',
                otherKey: 'albumId',
            });
            Song.belongsToMany(models.Artist, {
                through: 'ArtistSong',
                as: 'artists',
                foreignKey: 'songId',
                otherKey: 'artistId',
            });
            Song.belongsToMany(models.Playlist, {
                through: 'PlaylistSong',
                as: 'playlists',
                foreignKey: 'songId',
                otherKey: 'playlistId',
            });
            Song.belongsToMany(models.User, {
                through: 'SongPlayHistory',
                as: 'playedByUsers',
                foreignKey: 'songId',
                otherKey: 'userId',
            });
            Song.belongsToMany(models.User, {
                through: 'Like',
                as: 'likedByUsers',
                foreignKey: 'songId',
                otherKey: 'userId',
            });
            Song.belongsToMany(models.User, {
                through: 'Comment',
                as: 'commentedByUsers',
                foreignKey: 'songId',
                otherKey: 'userId',
            });
            Song.hasMany(models.Like, {
                foreignKey: 'songId',
                as: 'likes',
            });
            Song.hasMany(models.SongPlayHistory, {
                foreignKey: 'songId',
                as: 'playHistory',
            });
            Song.hasMany(models.ArtistSong, {
                foreignKey: 'songId',
                as: 'artistSong',
            });
            Song.hasMany(models.Comment, {
                foreignKey: 'songId',
                as: 'comments',
            });
        }
    }
    Song.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4,
            },
            title: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            duration: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            lyric: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            filePathAudio: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            privacy: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            uploadUserId: {
                type: DataTypes.UUID,
                references: {
                    model: 'User',
                    key: 'id',
                },
                allowNull: true,
            },
            releaseDate: {
                type: DataTypes.DATE,
            },
            image: {
                type: DataTypes.STRING,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: 'Song',
            freezeTableName: true,
        },
    );
    return Song;
};
