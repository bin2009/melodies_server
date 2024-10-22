const playlistService = require('../services/playlistService');
const statusCodes = require('../utils/statusCodes');

const createPlaylist = async (req, res) => {
    const response = await playlistService.createPlaylistService(req.body, req.user.id);
    return res.status(statusCodes[response.errCode]).json(response);
};

const addSongToPlaylist = async (req, res) => {
    const { playlistId, songId } = req.body;
    const response = await playlistService.addSongToPlaylistService(playlistId, songId);
    return res.status(statusCodes[response.errCode]).json(response);
};

module.exports = {
    createPlaylist,
    addSongToPlaylist,
};
