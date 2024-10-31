'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class UserPlaylist extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    }
    UserPlaylist.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: DataTypes.UUIDV4,
            },
            userId: {
                type: DataTypes.UUID,
                references: {
                    model: 'User',
                    key: 'id',
                },
                allowNull: false,
            },
            playlistId: {
                type: DataTypes.UUID,
                references: {
                    model: 'Playlist',
                    key: 'id',
                },
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: 'UserPlaylist',
        },
    );
    return UserPlaylist;
};
