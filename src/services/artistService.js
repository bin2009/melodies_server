const db = require('../models');

const getPopularArtistService = async () => {
    try {
        // const popArtists = await db.Artist.findAll({
        //     attributes: ['id', 'name', 'avatar'],
        //     include: [
        //         {
        //             model: db.Genre,
        //         },
        //     ],
        // });
        const popArtists = await db.Album.findAll({
            attributes: ['albumId', 'title', 'albumType'],
            include: [
                {
                    model: db.Song,
                    as: 'songs'
                }
            ]
        })
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
