const { AlbumTypes } = require('./enum');

module.exports = (sequelize, DataTypes, Model) => {
    class Album extends Model {}

    Album.init(
        {
            albumId: {
                type: DataTypes.STRING,
                primaryKey: true,
                // autoIncrement: true,
                allowNull: false,
            },
            title: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            releaseDate: {
                type: DataTypes.DATE,
            },
            // coverImage: {
            //     type: DataTypes.STRING,
            // },
            albumType: {
                type: DataTypes.ENUM(Object.values(AlbumTypes)),
            },
        },
        {
            sequelize,
            tableName: 'Album',
            modelName: 'Album',
        },
    );
    return Album;
};
