const db = require('../models');

const getAdsService = async (adsId) => {
    try {
        const ads = await db.Ads.findByPk(adsId);
        return {
            errCode: 200,
            message: 'Get ads successfully',
            ads: ads,
        };
    } catch (error) {
        return {
            errCode: 500,
            errMess: `Get ads failed: ${error.message}`,
        };
    }
};

const getRandomAdsService = async () => {
    try {
        const ads = await db.Ads.findAll({
            where: { status: 'active' },
            order: db.Sequelize.literal('RANDOM()'),
            limit: 1,
        });
        return {
            errCode: 200,
            message: 'Ads',
            ads: ads,
        };
    } catch (error) {
        return {
            errCode: 500,
            errMess: `Get random ads failed: ${error.message}`,
        };
    }
};

const impressionService = async (adsId) => {
    try {
        const ads = await db.Ads.findByPk(adsId);
        if (!ads) {
            return {
                errCode: 404,
                message: 'Ads not found',
            };
        }
        await db.Ads.increment('impressionCount', { where: { id: adsId } });
        return {
            errCode: 200,
            message: 'Increase impressions successfully',
        };
    } catch (error) {
        return {
            errCode: 500,
            errMess: `Increase impressions failed: ${error.message}`,
        };
    }
};

module.exports = {
    getAdsService,
    getRandomAdsService,
    impressionService,
};
