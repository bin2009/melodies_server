module.exports = (sequelize, DataTypes, Model, Album) => {
    class AlbumImage extends Model {}

    AlbumImage.init(
        {
            albumId: {
                type: DataTypes.STRING,
                references: {
                    model: Album,
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
            tableName: 'AlbumImage',
            modelName: 'AlbumImage',
        },
    );

    return AlbumImage;
};
