const songService = require('../services/songService');
const statusCodes = require('../utils/statusCodes');

const getAllSong = async (req, res) => {
    const response = await songService.getAllSongService();
    return res.status(statusCodes[response.errCode]).json(response);
};

const getSong = async (req, res) => {
    const response = await songService.getSongService(req.params.songId);
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

const getWeeklyTopSongs = async (req, res) => {
    const response = await songService.getWeeklyTopSongsService();
    return res.status(statusCodes[response.errCode]).json(response);
};

const getTrendingSongs = async (req, res) => {
    const response = await songService.getTrendingSongsService();
    return res.status(statusCodes[response.errCode]).json(response);
};

const getNewReleaseSongs = async (req, res) => {
    const response = await songService.getNewReleaseSongsService();
    return res.status(statusCodes[response.errCode]).json(response);

}

module.exports = {
    getSong,
    deleteSong,
    updateSong,
    createSong,
    getAllSong,
    getWeeklyTopSongs,
    getTrendingSongs,
    getNewReleaseSongs
};
