'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class PersonalSong extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            // PersonalSong.belongsTo(models.Album, { foreignKey: 'albumId', as: 'album' });
        }
    }
    PersonalSong.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
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
            title: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            duration: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },
            filePathAudio: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            lyric: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: 'PersonalSong',
        },
    );
    return PersonalSong;
};
