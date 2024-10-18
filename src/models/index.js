const { Sequelize, DataTypes, Model } = require('sequelize');


const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
        ssl: false
    },
  });

// const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
//     host: process.env.DB_HOST,
//     port: process.env.DB_PORT,
//     logging: false,
//     dialect: 'postgres',
//     dialectOptions: {
//         ssl: {
//             require: true,
//             rejectUnauthorized: false,
//         },
//     },
// });

try {
    sequelize.authenticate();
    console.log('Connection has been established successfully.');
} catch (error) {
    console.error('Unable to connect to the database:', error);
}

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.User = require('./User')(sequelize, DataTypes, Model);
db.Album = require('./Album')(sequelize, DataTypes, Model);
db.AlbumImage = require('./AlbumImage')(sequelize, DataTypes, Model, db.Album);
db.Song = require('./Song')(sequelize, DataTypes, Model, db.Album, db.User);
db.Artist = require('./Artist')(sequelize, DataTypes, Model);
db.ArtistSong = require('./ArtistSong')(sequelize, DataTypes, Model, db.Song, db.Artist);
db.Like = require('./Like')(sequelize, DataTypes, Model, db.User, db.Song);
db.SongPlayHistory = require('./SongPlayHistory')(sequelize, DataTypes, Model, db.User, db.Song);
db.Playlist = require('./Playlist')(sequelize, DataTypes, Model, db.User);
db.PlaylistSong = require('./PlaylistSong')(sequelize, DataTypes, Model, db.Playlist, db.Song);
db.Follow = require('./Follow')(sequelize, DataTypes, Model, db.User, db.Artist);
db.Genre = require('./Genre')(sequelize, DataTypes, Model);
db.ArtistGenre = require('./ArtistGenre')(sequelize, DataTypes, Model, db.Artist, db.Genre);
db.SubscriptionPackage = require('./SubscriptionPackage')(sequelize, DataTypes, Model);
db.Subscriptions = require('./Subscriptions')(sequelize, DataTypes, Model, db.User, db.SubscriptionPackage);
db.SearchHistory = require('./SearchHistory')(sequelize, DataTypes, Model, db.User);
db.Comment = require('./Comment')(sequelize, DataTypes, Model, db.User, db.Song);
db.Report = require('./Report')(sequelize, DataTypes, Model, db.Comment);

// Album & AlbumImage
db.Album.hasMany(db.AlbumImage, { foreignKey: 'albumId', as: 'albumImages' });
db.AlbumImage.belongsTo(db.Album, { foreignKey: 'albumId', as: 'album' });

// Song & Artist
db.Song.belongsToMany(db.Artist, { through: db.ArtistSong, foreignKey: 'songId', as: 'artistsOfSong' });
db.Artist.belongsToMany(db.Song, { through: db.ArtistSong, foreignKey: 'artistId', as: 'songsOfArtist' });

// Song & User: upload
db.User.hasMany(db.Song, { foreignKey: 'uploadUserId', as: 'uploadedSongs' }); // alias cho các bài hát mà người dùng đã tải lên
db.Song.belongsTo(db.User, { foreignKey: 'uploadUserId', as: 'uploader' }); // alias cho người dùng tải lên bài hát

// Song & Album
db.Album.hasMany(db.Song, { foreignKey: 'albumId', as: 'songsOfAlbum' });
db.Song.belongsTo(db.Album, { foreignKey: 'albumId', as: 'albumOfSong' });

// User & Song through Like
db.User.belongsToMany(db.Song, { through: db.Like, foreignKey: 'userId', as: 'likedSongs' });
db.Song.belongsToMany(db.User, { through: db.Like, foreignKey: 'songId', as: 'likedByUsers' });

// User & Song through SongPlayHistory
db.User.belongsToMany(db.Song, { through: db.SongPlayHistory, foreignKey: 'userId', as: 'playedSongs' });
db.Song.belongsToMany(db.User, { through: db.SongPlayHistory, foreignKey: 'songId', as: 'playedByUsers' });

// User & Playlist
db.User.hasMany(db.Playlist, { foreignKey: 'userId', as: 'playlistsOfUser' });
db.Playlist.belongsTo(db.User, { foreignKey: 'userId', as: 'userOfPlaylist' });

// Playlist & Song through PlaylistSong
db.Playlist.belongsToMany(db.Song, { through: db.PlaylistSong, foreignKey: 'playlistId', as: 'songsOfPlaylist' });
db.Song.belongsToMany(db.Playlist, { through: db.PlaylistSong, foreignKey: 'songId', as: 'playlistsOfSong' });

// User & Artist through Follow
db.User.belongsToMany(db.Artist, { through: db.Follow, foreignKey: 'userId', as: 'followedArtists' });
db.Artist.belongsToMany(db.User, { through: db.Follow, foreignKey: 'artistId', as: 'followers' });

// Artist & Genre through ArtistGenre
db.Artist.belongsToMany(db.Genre, { through: db.ArtistGenre, foreignKey: 'artistId', as: 'artistOfGenre' });
db.Genre.belongsToMany(db.Artist, { through: db.ArtistGenre, foreignKey: 'genreId', as: 'genreOfArtist' });

// User & SubscriptionPackage through Subscriptions
db.User.belongsToMany(db.SubscriptionPackage, {
    through: db.Subscriptions,
    foreignKey: 'userId',
    as: 'subPackagesOfUser',
});
db.SubscriptionPackage.belongsToMany(db.User, {
    through: db.Subscriptions,
    foreignKey: 'packageId',
    as: 'usersSubPackage',
});

// User & SearchHistory
db.User.hasMany(db.SearchHistory, { foreignKey: 'userId', as: 'searchesOfUser' });
db.SearchHistory.belongsTo(db.User, { foreignKey: 'userId', as: 'userOfSearch' });

// User & Song through Comment
db.User.belongsToMany(db.Song, { through: db.Comment, foreignKey: 'userId', as: 'commentedSongs' });
db.Song.belongsToMany(db.User, { through: db.Comment, foreignKey: 'songId', as: 'commentingUsers' });

db.sequelize.sync({ alter: true });
// db.sequelize.sync({ force: true });

module.exports = db;
