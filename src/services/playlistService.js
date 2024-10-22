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

const getAllPlaylistsService = async (userId) => {
    try {
        const playlists = await Playlist.findAll({
            where: { userId },
            include: [
                {
                    model: PlaylistSong,
                    as: 'songs',
                    attributes: ['songId'],
                },
            ],
        });
        return { errCode: 200, data: playlists };
    } catch (error) {
        console.error(error);
        return { errCode: 500, message: 'Failed to retrieve playlists' };
    }
};

const getPlaylistService = async (playlistId) => {
    try {
        const playlist = await Playlist.findOne({
            where: { id: playlistId },
            include: [
                {
                    model: PlaylistSong,
                    as: 'songs',
                    attributes: ['songId'],
                },
            ],
        });

        if (!playlist) {
            return { errCode: 404, message: 'Playlist not found' };
        }

        return { errCode: 200, data: playlist };
    } catch (error) {
        console.error(error);
        return { errCode: 500, message: 'Failed to retrieve playlist' };
    }
};

const updatePlaylistService = async (playlistId, updateData) => {
    try {
        const playlist = await Playlist.findOne({ where: { id: playlistId } });
        if (!playlist) {
            return { errCode: 404, message: 'Playlist not found' };
        }

        await Playlist.update(updateData, { where: { id: playlistId } });
        return { errCode: 200, message: 'Playlist updated successfully' };
    } catch (error) {
        console.error(error);
        return { errCode: 500, message: 'Failed to update playlist' };
    }
};

const deletePlaylistService = async (playlistId) => {
    try {
        const playlist = await Playlist.findOne({ where: { id: playlistId } });
        if (!playlist) {
            return { errCode: 404, message: 'Playlist not found' };
        }

        await PlaylistSong.destroy({ where: { playlistId } });

        await Playlist.destroy({ where: { id: playlistId } });

        return { errCode: 200, message: 'Playlist deleted successfully' };
    } catch (error) {
        console.error(error);
        return { errCode: 500, message: 'Failed to delete playlist' };
    }
};

const addSongToPlaylistService = async (playlistId, songId) => {
    try {
        const existingEntry = await PlaylistSong.findOne({ where: { playlistId, songId } });
        if (existingEntry) {
            return { errCode: 409, message: 'Song is already in the playlist' };
        }

        await PlaylistSong.create({ playlistId, songId });
        return { errCode: 200, message: 'Song added to playlist' };
    } catch (error) {
        console.error(error);
        return { errCode: 500, message: 'Failed to add song to playlist' };
    }
};

const removeSongFromPlaylistService = async (playlistId, songId) => {
    try {
        const entry = await PlaylistSong.findOne({ where: { playlistId, songId } });
        if (!entry) {
            return { errCode: 404, message: 'Song not found in the playlist' };
        }

        await PlaylistSong.destroy({ where: { playlistId, songId } });
        return { errCode: 200, message: 'Song removed from playlist' };
    } catch (error) {
        console.error(error);
        return { errCode: 500, message: 'Failed to remove song from playlist' };
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
    getAllPlaylistsService,
    getPlaylistService,
    updatePlaylistService,
    deletePlaylistService,
    addSongToPlaylistService,
    removeSongFromPlaylistService,
    findOrCreateLikedPlaylist,
};
