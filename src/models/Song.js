module.exports = (sequelize, DataTypes, Model, Album, User) => {
    class Song extends Model {}

    Song.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4,
            },
            albumId: {
                type: DataTypes.UUID,
                references: {
                    model: Album,
                    key: 'albumId',
                },
                allowNull: true,
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
            uploadUserId: {
                type: DataTypes.UUID,
                references: {
                    model: User,
                    key: 'id',
                },
                allowNull: true,
            },
        },
        {
            sequelize,
            tableName: 'Song',
            modelName: 'Song',
        },
    );

    return Song;
};
