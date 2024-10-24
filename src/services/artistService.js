const db = require('../models');

const getPopularArtistService = async () => {
    try {
        const popArtists = await db.Artist.findAll({
            attributes: [
                'id',
                'name',
                'avatar',
                [db.Sequelize.fn('COUNT', db.Sequelize.col('followers.id')), 'follower'],
                // 'followersCount'
            ],
            include: [
                {
                    model: db.Genre,
                    as: 'genres',
                    attributes: ['genreId', 'name'],
                    through: {
                        attributes: [],
                    },
                },
                {
                    model: db.User,
                    as: 'followers',
                    attributes: [],
                    through: {
                        attributes: [],
                    },
                },
            ],
            group: ['Artist.id', 'genres.genreId'],
            order: [[db.Sequelize.fn('COUNT', db.Sequelize.col('followers.id')), 'DESC']],
        });
        return {
            errCode: 200,
            message: 'Get popular artists successfully',
            popArtists: popArtists,
        };
    } catch (error) {
        return {
            errCode: 500,
            message: `Get popular artists failed: ${error.message}`,
        };
    }
};

module.exports = {
    getPopularArtistService,
};
