'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Album extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            Album.hasMany(models.AlbumImage, { foreignKey: 'albumId', as: 'albumImages' });
            Album.hasMany(models.Song, { foreignKey: 'albumId', as: 'songs' });
        }
    }
    Album.init(
        {
            albumId: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: DataTypes.UUIDV4,
            },
            title: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            releaseDate: {
                type: DataTypes.DATE,
            },
            albumType: {
                type: DataTypes.ENUM('album', 'single', 'ep'),
            },
        },
        {
            sequelize,
            modelName: 'Album',
        },
    );
    return Album;
};
