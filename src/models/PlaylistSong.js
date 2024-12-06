'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class PlaylistSong extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            PlaylistSong.belongsTo(models.Playlist, {
                foreignKey: 'playlistId',
                as: 'playlist',
            });
        }
    }
    PlaylistSong.init(
        {
            playlistSongId: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: DataTypes.UUIDV4,
            },
            playlistId: {
                type: DataTypes.UUID,
                references: {
                    model: 'Playlist',
                    key: 'id',
                },
                allowNull: false,
            },
            songId: {
                type: DataTypes.UUID,
                references: {
                    model: 'Song',
                    key: 'id',
                },
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: 'PlaylistSong',
            freezeTableName: true,
        },
    );
    return PlaylistSong;
};
