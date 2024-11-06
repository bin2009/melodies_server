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

module.exports = {
    getAllArtistName,
    getAllGenreName,
    createGenre,
    createArtistGenre,
};
