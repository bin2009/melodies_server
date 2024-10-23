const artistService = require('../services/artistService');
const statusCodes = require('../utils/statusCodes');

const getPopularArtist = async (req, res) => {
    const response = await artistService.getPopularArtistService();
    return res.status(response.errCode).json(response);
};

module.exports = {
    getPopularArtist,
};
