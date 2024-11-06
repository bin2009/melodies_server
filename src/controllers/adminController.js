const db = require('../models');
const adminService = require('../services/adminService');

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

module.exports = {
    getRecentUser,
    getRecentComment,
    getTotalPlayAndCmtYear,
    getUserGrowth,
    getTotal,
    getTodayBestSong,
};
