'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Genre extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            Genre.belongsToMany(models.Artist, {
                through: 'ArtistGenre',
                as: 'artists',
                foreignKey: 'genreId',
                otherKey: 'artistId',
            });
        }
    }
    Genre.init(
        {
            genreId: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: DataTypes.UUIDV4,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: 'Genre',
        },
    );
    return Genre;
};
