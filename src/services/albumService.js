const db = require('../models');

const getAlbumService = async (albumId) => {
    try {
        // const album = await db.Song.findAll();
        const album = await db.Album.findByPk(albumId, {
            attributes: {
                exclude: ['createdAt', 'updatedAt'],
            },
            include: [
                {
                    model: db.Song,
                    as: 'songs',
                    attributes: { exclude: ['albumId', 'createdAt', 'updatedAt'] },
                    include: [
                        {
                            model: db.Artist,
                            as: 'artists',
                            attributes: ['id', 'name'],
                            through: {
                                attributes: ['main']
                            }
                        },
                    ],
                },
                {
                    model: db.AlbumImage,
                    as: 'albumImages',
                    attributes: ['image', 'size'],
                },
            ],
        });

        if (!album) {
            return {
                errCode: 404,
                message: 'Album not found',
            };
        }
        return {
            errCode: 200,
            message: 'Get album successfully',
            album: album,
        };
    } catch (error) {
        return {
            errCode: 500,
            message: `Get album failed: ${error.message}`,
        };
    }
};

module.exports = {
    getAlbumService,
};
