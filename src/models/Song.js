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
                allowNull: true,
            },
            lyric: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            filePathAudio: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            privacy: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
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

    Song.associate = (models) => {
        Song.belongsTo(models.Album, {
            foreignKey: 'albumId',
            as: 'album',
        });
        Song.hasMany(models.SongPlayHistory, {
            foreignKey: 'songId',
            as: 'songPlayHistories',
        });
        Song.hasMany(models.Like, {
            foreignKey: 'songId',
            as: 'likesSong',
        });
        Song.belongsToMany(models.Artist, {
            through: 'ArtistSong',
            as: 'artists',
            foreignKey: 'songId',
            otherKey: 'artistId',
        });
        Song.belongsToMany(models.User, {
            through: 'Like',
            as: 'usersLike',
            foreignKey: 'songId',
            otherKey: 'userId',
        });
        Song.belongsToMany(models.User, {
            through: 'SongPlayHistory',
            as: 'usersHistory',
            foreignKey: 'songId',
            otherKey: 'userId',
        });
    };

    return Song;
};
