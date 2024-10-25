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

// ---------------------------THEME MUSIC------------------

const getWeeklyTopSongs = async (req, res) => {
    const response = await songService.getWeeklyTopSongsService(req.query.offset);
    return res.status(response.errCode).json(response);
};

const getTrendingSongs = async (req, res) => {
    const response = await songService.getTrendingSongsService(req.query.offset);
    return res.status(statusCodes[response.errCode]).json(response);
};

const getNewReleaseSongs = async (req, res) => {
    const response = await songService.getNewReleaseSongsService(req.query.offset);
    return res.status(statusCodes[response.errCode]).json(response);
};

const getPopularArtist = async (req, res) => {
    const response = await songService.getPopularArtistService();
    return res.status(statusCodes[response.errCode]).json(response);
};

// ---------------------------ARTIST------------------

const getAllArtist = async (req, res) => {
    const response = await songService.getAllArtistService();
    return res.status(statusCodes[response.errCode]).json(response);
};

const getArtist = async (req, res) => {
    const response = await songService.getArtistService(req.params.id);
    return res.status(statusCodes[response.errCode]).json(response);
};

const createArtist = async (req, res) => {
    const response = await songService.createArtistService(req.body);
    return res.status(statusCodes[response.errCode]).json(response);
};

const deleteArtist = async (req, res) => {
    const response = await songService.deleteArtistService(req.params.id);
    return res.status(statusCodes[response.errCode]).json(response);
};

const updateArtist = async (req, res) => {
    const response = await songService.updateArtistService(req.body);
    return res.status(statusCodes[response.errCode]).json(response);
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

module.exports = {
    getSong,
    deleteSong,
    updateSong,
    createSong,
    getAllSong,
    // ------------
    getWeeklyTopSongs,
    getTrendingSongs,
    getNewReleaseSongs,
    getPopularArtist,
    // ------------
    getAllArtist,
    getArtist,
    createArtist,
    deleteArtist,
    updateArtist,
    // ------------
    createGenre,
    // ---------
    getAllAlbum,
    getAlbumPopular,
};
