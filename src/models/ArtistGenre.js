'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class ArtistGenre extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    }
    ArtistGenre.init(
        {
            artistGenreId: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: DataTypes.UUIDV4,
            },
            artistId: {
                type: DataTypes.UUID,
                references: {
                    model: 'Artist',
                    key: 'id',
                },
                allowNull: false,
            },
            genreId: {
                type: DataTypes.UUID,
                references: {
                    model: 'Genre',
                    key: 'genreId',
                },
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: 'ArtistGenre',
        },
    );
    return ArtistGenre;
};
