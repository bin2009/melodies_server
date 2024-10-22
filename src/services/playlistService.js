const { Playlist, PlaylistSong } = require('../models');

const createPlaylistService = async (playlistData, userId) => {
    try {
        const newPlaylist = await Playlist.create({
            ...playlistData,
            userId,
        });
        return { errCode: 201, data: newPlaylist };
    } catch (error) {
        console.error(error);
        return { errCode: 500, message: 'Failed to create playlist' };
    }
};

const addSongToPlaylistService = async (playlistId, songId) => {
    try {
        await PlaylistSong.create({ playlistId, songId });
        return { errCode: 200, message: 'Song added to playlist' };
    } catch (error) {
        console.error(error);
        return { errCode: 500, message: 'Failed to add song to playlist' };
    }
};

const findOrCreateLikedPlaylist = async (userId) => {
    let likedPlaylist = await Playlist.findOne({
        where: { userId, title: 'Liked Songs' }
    });

    if (!likedPlaylist) {
        likedPlaylist = await Playlist.create({
            userId,
            title: 'Liked Songs',
            privacy: true,
        });
    }

    return likedPlaylist;
};

module.exports = {
    createPlaylistService,
    addSongToPlaylistService,
    findOrCreateLikedPlaylist,
};
