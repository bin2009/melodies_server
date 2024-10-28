const artistService = require('../services/artistService');
const statusCodes = require('../utils/statusCodes');

const getAllArtist = async (req, res) => {
    const response = await artistService.getAllArtistService(req.query.offset);
    return res.status(response.errCode).json(response);
};

const getArtist = async (req, res) => {
    const response = await artistService.getArtistService(req.params.id);
    return res.status(response.errCode).json(response);
};

const createArtist = async (req, res) => {
    const response = await artistService.createArtistService(req.body);
    return res.status(response.errCode).json(response);
};

const deleteArtist = async (req, res) => {
    const response = await artistService.deleteArtistService(req.params.id);
    return res.status(response.errCode).json(response);
};

const updateArtist = async (req, res) => {
    const response = await artistService.updateArtistService(req.body);
    return res.status(response.errCode).json(response);
};

const getMoreArtist = async (req, res) => {
    const response = await artistService.getMoreArtistService(req.params.artistId);
    return res.status(response.errCode).json(response);
}

// ----------------------------------------------------------------

const getPopularArtist = async (req, res) => {
    const response = await artistService.getPopularArtistService(req.query.offset);
    return res.status(response.errCode).json(response);
};

module.exports = {
    getAllArtist,
    getArtist,
    deleteArtist,
    updateArtist,
    createArtist,
    getPopularArtist,
    getMoreArtist,
};
