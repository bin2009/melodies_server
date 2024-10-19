const songService = require('../services/songService');
const statusCodes = require('../utils/statusCodes');

const getSong = async (req, res) => {
    const response = await songService.getSongService(req.body.key);
    return res.status(statusCodes[response.errCode]).json(response);
};

const deleteSong = async (req, res) => {
    const response = await songService.deleteSongService(req.body.songId);
    return res.status(statusCodes[response.errCode]).json(response);
};

const updateSong = async (req, res) => {
    const response = await songService.updateSongService(req.body);
    return res.status(statusCodes[response.errCode]).json(response);
};

const createSong = async (req, res) => {
    const response = await songService.createSongService(req.body);
    return res.status(statusCodes[response.errCode]).json(response);
};

module.exports = {
    getSong,
    deleteSong,
    updateSong,
    createSong,
};
