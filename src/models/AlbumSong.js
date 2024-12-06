'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class AlbumSong extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            AlbumSong.belongsTo(models.Album, {
                foreignKey: 'albumId',
                as: 'albumSong',
            });
        }
    }
    AlbumSong.init(
        {
            id: {
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
            albumId: {
                type: DataTypes.UUID,
                references: {
                    model: 'Album',
                    key: 'albumId',
                },
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: 'AlbumSong',
            freezeTableName: true,
        },
    );
    return AlbumSong;
};
