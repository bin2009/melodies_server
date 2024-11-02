const songService = require('../services/songService');
const statusCodes = require('../utils/statusCodes');

// ---------------------------SONG------------------
const getAllSong = async (req, res) => {
    const response = await songService.getAllSongService(req.query.offset);
    return res.status(response.errCode).json(response);
};

const getSong = async (req, res) => {
    const response = await songService.getSongService(req.params.id);
    return res.status(response.errCode).json(response);
};

// const getMoreSong = async (req,res) => {
//     const response = await songService.getMoreSongService(req.params.id);
//     return res.status(response.errCode).json(response);
// }

const deleteSong = async (req, res) => {
    const response = await songService.deleteSongService(req.params.id);
    return res.status(response.errCode).json(response);
};

const updateSong = async (req, res) => {
    const response = await songService.updateSongService(req.body);
    return res.status(response.errCode).json(response);
};

const createSong = async (req, res) => {
    const response = await songService.createSongService(req.body);
    return res.status(response.errCode).json(response);
};

// ---------------------------RANDOM------------------

const getSongRandom = async (req, res) => {
    const response = await songService.getSongRandomService();
    return res.status(response.errCode).json(response);
};

// ---------------------------THEME MUSIC------------------

const getWeeklyTopSongs = async (req, res) => {
    const response = await songService.getWeeklyTopSongsService(req.query.offset, req.user);
    return res.status(response.errCode).json(response);
};

const getTrendingSongs = async (req, res) => {
    const response = await songService.getTrendingSongsService(req.query.offset, req.user);
    return res.status(response.errCode).json(response);
};

const getNewReleaseSongs = async (req, res) => {
    const response = await songService.getNewReleaseSongsService(req.query.offset, req.user);
    return res.status(response.errCode).json(response);
};

// ---------------------------GENRE------------------

const createGenre = async (req, res) => {
    const response = await songService.createGenreService(req.body);
    return res.status(statusCodes[response.errCode]).json(response);
};

// ---------------------------ALBUM------------------

const getAllAlbum = async (req, res) => {
    const response = await songService.getAllAlbumService();
    return res.status(statusCodes[response.errCode]).json(response);
};

const getAlbumPopular = async (req, res) => {
    const response = await songService.getAlbumPopularService();
    return res.status(statusCodes[response.errCode]).json(response);
};

// ---------------------------COMMENT------------------

const getCommentSong = async (req, res) => {
    const response = await songService.getCommentSongService(req.params.songId);
    return res.status(response.errCode).json(response);
};

module.exports = {
    getSong,
    // getMoreSong,
    deleteSong,
    updateSong,
    createSong,
    getAllSong,
    // -----------
    getSongRandom,
    // ------------
    getWeeklyTopSongs,
    getTrendingSongs,
    getNewReleaseSongs,
    // ------------
    createGenre,
    // ---------
    getAllAlbum,
    getAlbumPopular,
    // ----------
    getCommentSong,
};
