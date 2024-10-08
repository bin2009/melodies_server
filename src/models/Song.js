module.exports = (sequelize, DataTypes, Model, Album) => {
    class Song extends Model {}

    Song.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            albumId: {
                type: DataTypes.INTEGER,
                references: {
                    model: Album,
                    key: 'albumId',
                },
                allowNull: false,
            },
            title: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            duration: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            lyric: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            filePathAudio: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            privacy: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
            },
            // uploaded_by_user: {
            //     type: DataTypes.INTEGER,
            //     references: {
            //         model: User,
            //         key: 'id',
            //     },
            //     allowNull: true,
            // },
        },
        {
            sequelize,
            tableName: 'Song',
            modelName: 'Song',
        },
    );

    return Song;
};
