'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class AlbumImage extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            AlbumImage.belongsTo(models.Album, { foreignKey: 'albumId', as: 'album' });
        }
    }
    AlbumImage.init(
        {
            albumImageId: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: DataTypes.UUIDV4,
            },
            albumId: {
                type: DataTypes.UUID,
                references: {
                    model: 'Album',
                    key: 'albumId',
                },
                allowNull: false,
            },
            image: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            size: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: 'AlbumImage',
            freezeTableName: true,
        },
    );
    return AlbumImage;
};
