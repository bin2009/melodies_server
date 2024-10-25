const db = require('../models');
const { Op, where } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

const getAllArtistService = async (offset) => {
    try {
        const artists = await db.Artist.findAll({
            attributes: ['id', 'name', 'avatar', 'createdAt'],
            include: [
                {
                    model: db.Genre,
                    as: 'genres',
                    attributes: ['genreId', 'name'],
                    through: {
                        attributes: [],
                    },
                },
            ],
            order: [['createdAt', 'DESC']],
            limit: 10,
            offset: 10 * offset,
        });

        const artistIds = artists.map((record) => record.id);

        const followCount = await db.Follow.findAll({
            where: {
                artistId: {
                    [Op.in]: artistIds,
                },
            },
            attributes: ['artistId', [db.Sequelize.fn('COUNT', db.Sequelize.col('followerId')), 'followCount']],
            group: ['artistId'],
            raw: true,
        });

        const followCountMap = followCount.reduce((acc, record) => {
            acc[record.artistId] = record.followCount;
            return acc;
        }, {});

        const artistWithFollow = artists.map((artist) => ({
            ...artist.toJSON(),
            followCount: followCountMap[artist.id] || 0,
        }));

        return {
            errCode: 200,
            message: 'Get all artists',
            artists: artistWithFollow,
        };
    } catch (error) {
        return {
            errCode: 500,
            message: `Get all artists failed: ${error.message}`,
        };
    }
};

const getArtistService = async (artistId) => {
    try {
        const artist = await db.Artist.findOne({
            where: { id: artistId },
            attributes: ['id', 'name', 'avatar', 'createdAt'],
            include: [
                {
                    model: db.Genre,
                    as: 'genres',
                    attributes: ['genreId', 'name'],
                    through: {
                        attributes: [],
                    },
                },
            ],
        });

        const followCountResult = await db.Follow.findAll({
            where: { artistId: artist.id },
            attributes: [[db.Sequelize.fn('COUNT', db.Sequelize.col('followerId')), 'followCount']],
            group: ['artistId'],
            raw: true,
        });

        const followCount = followCountResult.length > 0 ? followCountResult[0].followCount : 0;

        const artistWithFollow = {
            ...artist.toJSON(),
            followCount: parseInt(followCount, 10) || 0,
        };

        return {
            errCode: 200,
            message: 'Get artist successfully',
            artists: artistWithFollow,
        };
    } catch (error) {
        return {
            errCode: 500,
            message: `Get artist failed: ${error.message}`,
        };
    }
};

const createArtistService = async (data) => {
    try {
        if (!data.genres || data.genres.length === 0) {
            return {
                errCode: 400,
                message: 'No genres provided',
            };
        }

        const artist = await db.Artist.findOne({
            where: {
                name: {
                    [Op.iLike]: `%${data.name.trim()}%`,
                },
            },
            attributes: ['name'],
            include: [
                {
                    model: db.Genre,
                    as: 'genres',
                    where: { genreId: data.genres[0].genreId },
                    attributes: [],
                    through: {
                        attributes: [],
                    },
                },
            ],
        });

        if (!artist) {
            const newArtist = await db.Artist.create({
                id: uuidv4(),
                name: data.name,
                avatar: data.avatar,
                bio: data.bio,
            });

            const genreArtist = data.genres
                .filter((genre) => genre.genreId)
                .map((genre, index) => {
                    return {
                        artistId: newArtist.id,
                        genreId: genre.genreId,
                    };
                });

            await db.ArtistGenre.bulkCreate(genreArtist);

            return {
                errCode: 200,
                message: 'Artist created successfully',
                newArtist: newArtist,
            };
        }

        return {
            errCode: 409,
            message: 'Artist exits',
        };
    } catch (error) {
        return {
            errCode: 500,
            message: `Create artist failed: ${error.message}`,
        };
    }
};

const deleteArtistService = async (artistId) => {
    try {
        const artist = await db.Artist.findOne({ where: { id: artistId } });
        if (artist) {
            await db.ArtistGenre.destroy({ where: { artistId: artistId } });
            await db.Artist.destroy({ where: { id: artistId } });

            return {
                errCode: 200,
                message: 'Delete artist successfully',
            };
        } else {
            return {
                errCode: 404,
                message: 'Artist not found',
            };
        }
    } catch (error) {
        return {
            errCode: 500,
            message: `Delete artist failed: ${error.message}`,
        };
    }
};

const updateArtistService = async (data) => {
    try {
        const artist = await db.Artist.findOne({ where: { id: data.id } });
        if (artist) {
            if (!data.genres || data.genres.length === 0) {
                await db.Artist.update(data.updateData, { where: { id: data.id } });
            } else {
                await db.ArtistGenre.destroy({ where: { artistId: data.id } });

                const genreArtist = data.genres
                    .filter((genre) => genre.genreId)
                    .map((genre, index) => {
                        return {
                            artistId: data.id,
                            genreId: genre.genreId,
                        };
                    });

                await db.ArtistGenre.bulkCreate(genreArtist);

                await db.Artist.update(data.updateData, { where: { id: data.id } });
            }
            return {
                errCode: 200,
                message: 'Update artist successfully',
            };
        } else {
            return {
                errCode: 404,
                message: 'Artist not found',
            };
        }
    } catch (error) {
        return {
            errCode: 500,
            message: `Update artist failed: ${error.message}`,
        };
    }
};

// ---------------------------------------------------------------------

const getPopularArtistService = async (offset) => {
    try {
        const topArtist = await db.Follow.findAll({
            attributes: ['artistId', [db.Sequelize.fn('COUNT', db.Sequelize.col('artistId')), 'followCount']],
            group: ['artistId'],
            order: [[db.Sequelize.fn('COUNT', db.Sequelize.col('artistId')), 'DESC']],
            limit: 10,
            offset: 10 * offset,
            raw: true,
        });

        const topArtistId = topArtist.map((record) => record.artistId);

        const popularArtists = await db.Artist.findAll({
            where: {
                id: {
                    [Op.in]: topArtistId,
                },
            },
            attributes: ['id', 'name', 'avatar', 'bio'],
            include: [
                {
                    model: db.Genre,
                    as: 'genres',
                    attributes: ['genreId', 'name'],
                    through: {
                        attributes: [],
                    },
                },
            ],
        });

        const artistMap = popularArtists.reduce((acc, artist) => {
            acc[artist.id] = artist.toJSON();
            return acc;
        }, {});

        const popularArtistsWithFollowCount = topArtistId.map((artistId) => ({
            ...artistMap[artistId],
            followCount: topArtist.find((record) => record.artistId === artistId).followCount,
        }));

        return {
            errCode: 200,
            message: 'Get popular artists successfully',
            popularArtist: popularArtistsWithFollowCount,
        };
    } catch (error) {
        return {
            errCode: 500,
            message: `Get popular artists failed: ${error.message}`,
        };
    }
};

module.exports = {
    getAllArtistService,
    getArtistService,
    deleteArtistService,
    updateArtistService,
    createArtistService,
    // ------------------
    getPopularArtistService,
};
