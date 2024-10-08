const { Sequelize, DataTypes, Model } = require('sequelize');

const sequelize = new Sequelize('melodies', 'postgres', '290321', {
    host: 'localhost',
    logging: false,
    dialect: 'postgres',
});

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
db.Song = require('./Song')(sequelize, DataTypes, Model, db.Album);
db.Artist = require('./Artist')(sequelize, DataTypes, Model);
db.ArtistSong = require('./ArtistSong')(sequelize, DataTypes, Model, db.Song, db.Artist);
db.Album = require('./Album')(sequelize, DataTypes, Model);
db.Like = require('./Like')(sequelize, DataTypes, Model, db.User, db.Song);
db.SongPlayHistory = require('./SongPlayHistory')(sequelize, DataTypes, Model, db.User, db.Song);
db.Playlist = require('./Playlist')(sequelize, DataTypes, Model, db.User);
db.PlaylistSong = require('./PlaylistSong')(sequelize, DataTypes, Model, db.Playlist, db.Song);
db.Follow = require('./Follow')(sequelize, DataTypes, Model, db.User, db.Artist);

// Song & Artist
db.Song.belongsToMany(db.Artist, { through: db.ArtistSong, foreignKey: 'songId', as: 'artistsOfSong' });
db.Artist.belongsToMany(db.Song, { through: db.ArtistSong, foreignKey: 'artistId', as: 'songsOfArtist' });

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

db.sequelize.sync({ alter: true });
// db.sequelize.sync({ force: true });

module.exports = db;
