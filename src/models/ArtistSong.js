'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class ArtistSong extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            ArtistSong.belongsTo(models.Song, {
                foreignKey: 'songId',
                as: 'song',
            });
            ArtistSong.belongsTo(models.Artist, {
                foreignKey: 'artistId',
                as: 'artist',
            });
        }
    }
    ArtistSong.init(
        {
            artistSongId: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: DataTypes.UUIDV4,
            },
            songId: {
                type: DataTypes.UUID,
                references: {
                    model: 'Song',
                    key: 'id',
                },
                allowNull: false,
            },
            artistId: {
                type: DataTypes.UUID,
                references: {
                    model: 'Artist',
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
            modelName: 'ArtistSong',
        },
    );
    return ArtistSong;
};
