'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Playlist extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            // Playlist.belongsTo(models.User, {
            //     foreignKey: 'userId',
            //     as: 'user',
            // });
            Playlist.belongsToMany(models.Song, {
                through: 'PlaylistSong',
                as: 'songs',
                foreignKey: 'playlistId',
                otherKey: 'songId',
            });
            Playlist.belongsToMany(models.User, {
                through: 'UserPlaylist',
                as: 'playlists',
                foreignKey: 'playlistId',
                otherKey: 'userId',
            });
            Playlist.hasMany(models.PlaylistSong, {
                foreignKey: 'playlistId',
                as: 'playlistSongs',
            });
        }
    }
    Playlist.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4,
            },
            // userId: {
            //     type: DataTypes.UUID,
            //     references: {
            //         model: 'User',
            //         key: 'id',
            //     },
            //     allowNull: false,
            // },
            title: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            playlistImage: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            privacy: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
        },
        {
            sequelize,
            modelName: 'Playlist',
        },
    );
    return Playlist;
};
