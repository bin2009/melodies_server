module.exports = (sequelize, DataTypes, Model) => {
    class Album extends Model {}

    Album.init(
        {
            albumId: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            title: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            releaseDate: {
                type: DataTypes.DATE,
            },
            coverImage: {
                type: DataTypes.STRING,
            },
            albumType: {
                type: DataTypes.ENUM('album', 'single', 'ep'),
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
