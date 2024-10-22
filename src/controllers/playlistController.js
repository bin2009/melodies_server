const playlistService = require('../services/playlistService');
const statusCodes = require('../utils/statusCodes');

const createPlaylist = async (req, res) => {
    const response = await playlistService.createPlaylistService(req.body, req.user.id);
    return res.status(statusCodes[response.errCode]).json(response);
};

const getAllPlaylists = async (req, res) => {
    const response = await playlistService.getAllPlaylistsService(req.user.id);
    return res.status(statusCodes[response.errCode]).json(response);
};

const getPlaylist = async (req, res) => {
    const response = await playlistService.getPlaylistService(req.params.id);
    return res.status(statusCodes[response.errCode]).json(response);
};

const updatePlaylist = async (req, res) => {
    const response = await playlistService.updatePlaylistService(req.params.id, req.body);
    return res.status(statusCodes[response.errCode]).json(response);
};

const deletePlaylist = async (req, res) => {
    const response = await playlistService.deletePlaylistService(req.params.id);
    return res.status(statusCodes[response.errCode]).json(response);
};

const addSongToPlaylist = async (req, res) => {
    const { playlistId, songId } = req.body;
    const response = await playlistService.addSongToPlaylistService(playlistId, songId);
    return res.status(statusCodes[response.errCode]).json(response);
};

const removeSongFromPlaylist = async (req, res) => {
    const { playlistId, songId } = req.body;
    const response = await playlistService.removeSongFromPlaylistService(playlistId, songId);
    return res.status(statusCodes[response.errCode]).json(response);
};

module.exports = {
    createPlaylist,
    getAllPlaylists,
    getPlaylist,
    updatePlaylist,
    deletePlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
};
