const adsService = require('../services/adsService');

const getAds = async (req, res) => {
    const response = await adsService.getAdsService(req.params.id);
    return res.status(response.errCode).json(response);
};

const getRandomAds = async (req, res) => {
    const response = await adsService.getRandomAdsService();
    return res.status(response.errCode).json(response);
};

const impression = async (req, res) => {
    const response = await adsService.impressionService(req.params.id);
    return res.status(response.errCode).json(response);
};

module.exports = {
    getAds,
    getRandomAds,
    impression,
};
