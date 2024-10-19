module.exports = (sequelize, DataTypes, Model, User) => {
    class Playlist extends Model {}

    Playlist.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4,
            },
            userId: {
                type: DataTypes.UUID,
                references: {
                    model: User,
                    key: 'id',
                },
                allowNull: false,
            },
            title: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            playlistImage: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            privacy: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
            },
        },
        {
            sequelize,
            tableName: 'Playlist',
            modelName: 'Playlist',
        },
    );
    return Playlist;
};
