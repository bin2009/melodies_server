const db = require('../models');
const adminService = require('../services/adminService');

const getAllArtistName = async (req, res) => {
    const response = await adminService.getAllArtistNameService();
    return res.status(response.errCode).json(response);
};

const getAllGenreName = async (req, res) => {
    const response = await adminService.getAllGenreNameService();
    return res.status(response.errCode).json(response);
};

const createGenre = async (req, res) => {
    const response = await adminService.createGenreService(req.body);
    return res.status(response.errCode).json(response);
};

const createArtistGenre = async (req, res) => {
    // return res.status(200).json(req.body);
    const response = await adminService.createArtistGenreService(req.body);
    return res.status(response.errCode).json(response);
};

const getRecentUser = async (req, res) => {
    if (!req.query.page) {
        return res.status(400).json({ errCode: 400, message: 'Missing required query parameters: page' });
    }
    const response = await adminService.getRecentUserService(req.query.page);
    return res.status(response.errCode).json(response);
};

const getRecentComment = async (req, res) => {
    if (!req.query.page) {
        return res.status(400).json({ errCode: 400, message: 'Missing required query parameters: page' });
    }
    const response = await adminService.getRecentCommentService(req.query.page);
    return res.status(response.errCode).json(response);
};

const getTotalPlayAndCmtYear = async (req, res) => {
    const response = await adminService.getTotalPlayAndCmtYearService();
    return res.status(response.errCode).json(response);
};

const getUserGrowth = async (req, res) => {
    const response = await adminService.getUserGrowthService();
    return res.status(response.errCode).json(response);
};

const getTotal = async (req, res) => {
    const response = await adminService.getTotalService();
    return res.status(response.errCode).json(response);
};

const getTodayBestSong = async (req, res) => {
    const response = await adminService.getTodayBestSongService();
    return res.status(response.errCode).json(response);
};

const getAllSong = async (req, res) => {
    if (!req.query.page) {
        return res.status(400).json({ errCode: 400, message: 'Missing required query parameters: page' });
    }
    const response = await adminService.getAllSongService(req.query.query, req.query.order, req.query.page);
    return res.status(response.errCode).json(response);
};

const getSongDetail = async (req, res) => {
    const response = await adminService.getSongDetailService(req.params.songId);
    return res.status(response.errCode).json(response);
};

const updateSong = async (req, res) => {
    const response = await adminService.updateSongService(req.body);
    return res.status(response.errCode).json(response);
};

const createSong = async (req, res) => {
    const response = await adminService.createSongService(req.body);
    return res.status(response.errCode).json(response);
};

const getAllArtist = async (req, res) => {
    if (!req.query.page) {
        return res.status(400).json({ errCode: 400, message: 'Missing required query parameters: page' });
    }
    const response = await adminService.getAllArtistService(req.query.query, req.query.order, req.query.page);
    return res.status(response.errCode).json(response);
};

module.exports = {
    getAllArtistName,
    getAllGenreName,
    createGenre,
    createArtistGenre,
    getRecentUser,
    getRecentComment,
    getTotalPlayAndCmtYear,
    getUserGrowth,
    getTotal,
    getTodayBestSong,
    // ----------------
    getAllSong,
    // getAllSong2,
    getSongDetail,
    updateSong,
    createSong,
    // ----------------
    getAllArtist,
};
