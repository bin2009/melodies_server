const { AlbumTypes } = require('./enum');

module.exports = (sequelize, DataTypes, Model) => {
    class Album extends Model {}

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
            // coverImage: {
            //     type: DataTypes.TE,
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

    Album.associate = (models) => {
        Album.hasMany(models.Song, {
            foreignKey: 'albumId',
            as: 'songsAlbum',
        });
    };

    return Album;
};
