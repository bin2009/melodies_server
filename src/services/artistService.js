const db = require('../models');
const { Op, where } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const Fuse = require('fuse.js');

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

const getMoreArtistService = async (artistId) => {
    try {
        const artist = await db.Artist.findByPk(artistId, {
            include: [
                {
                    model: db.ArtistGenre,
                    as: 'artistGenres',
                    attributes: ['genreId'],
                },
            ],
            attributes: ['id', 'name', 'avatar'],
        });

        if (!artist) {
            return {
                errCode: 404,
                message: 'Artist not found',
            };
        }

        // lấy ra song của artist
        const songs = await db.ArtistSong.findAll({
            where: { artistId: artist.id, main: true },
            attributes: ['songId', 'artistId'],
            include: [
                {
                    model: db.Song,
                    as: 'song',
                    attributes: ['id', 'albumId'],
                },
            ],
        });

        const songIds = songs.map((record) => record.songId);

        // lấy ra 5 bài hát có view cao nhất
        const songsTop10View = await db.SongPlayHistory.findAll({
            where: {
                songId: {
                    [Op.in]: songIds,
                },
            },
            attributes: ['songId', [db.Sequelize.fn('COUNT', db.Sequelize.col('songId')), 'viewCount']],
            group: ['songId'],
            order: [[db.Sequelize.fn('COUNT', db.Sequelize.col('songId')), 'DESC']],
            limit: 10,
            // raw: true,
        });

        const songTop10ViewIds = songsTop10View.map((rec) => rec.songId);

        const popSong = await db.Song.findAll({
            where: {
                id: {
                    [Op.in]: songTop10ViewIds,
                },
            },
            attributes: [
                'id',
                'title',
                'releaseDate',
                'duration',
                'lyric',
                'filePathAudio',
                [db.Sequelize.fn('COUNT', db.Sequelize.col('playHistory.historyId')), 'viewCount'],
            ],
            // attributes: {
            //     exclude: ['createdAt', 'updatedAt'],
            //     include: [[db.Sequelize.fn('COUNT', db.Sequelize.col('playHistory.historyId')), 'viewCount']],
            // },
            include: [
                {
                    model: db.SongPlayHistory,
                    as: 'playHistory',
                    attributes: [],
                },
                {
                    model: db.Album,
                    as: 'album',
                    attributes: ['albumId', 'title'],
                    include: [
                        {
                            model: db.AlbumImage,
                            as: 'albumImages',
                            attributes: ['image', 'size'],
                        },
                    ],
                },
                {
                    model: db.Artist,
                    as: 'artists',
                    attributes: ['id', 'name', 'avatar'],
                    through: {
                        attributes: ['main'],
                    },
                },
            ],
            group: [
                'Song.id',
                'album.albumId',
                'album.albumImages.albumImageId',
                'artists.id',
                'artists->ArtistSong.artistSongId',
            ],
            order: [[db.Sequelize.fn('COUNT', db.Sequelize.col('playHistory.historyId')), 'DESC']],
        });

        // // list album của nghệ sĩ từ list song id
        // lấy ra list song của album
        // lấy ra list id album tương ứng

        const albumIds = [...new Set(songs.map((record) => record.song.albumId))];

        const artistAlbum = await db.Album.findAll({
            where: {
                albumId: {
                    [Op.in]: albumIds,
                },
                albumType: {
                    [Op.or]: ['album', 'ep'],
                },
            },
            attributes: ['albumId', 'title', 'releaseDate', 'albumType'],
            include: [
                {
                    model: db.AlbumImage,
                    as: 'albumImages',
                    attributes: ['image', 'size'],
                },
            ],
            order: [['releaseDate', 'DESC']],
            limit: 10,
        });

        const artistSingle = await db.Album.findAll({
            where: {
                albumId: {
                    [Op.in]: albumIds,
                },
                albumType: 'single',
            },
            attributes: ['albumId', 'title', 'releaseDate', 'albumType'],
            include: [
                {
                    model: db.AlbumImage,
                    as: 'albumImages',
                    attributes: ['image', 'size'],
                },
            ],
            order: [['releaseDate', 'DESC']],
            limit: 10,
        });

        // lấy ra các artist feat cùng
        // lấy ra các bài hát -> tìm ra các nghệ sĩ khác main -> lấy thông tin
        // songIds
        const artistFeatIds = await db.ArtistSong.findAll({
            where: {
                songId: {
                    [Op.in]: songIds,
                },
                artistId: {
                    [Op.not]: artist.id,
                },
            },
            attributes: ['songId', 'artistId'],
        });

        const artistFeat = await db.Artist.findAll({
            where: {
                id: {
                    [Op.in]: artistFeatIds.map((rec) => rec.artistId),
                },
            },
            attributes: ['id', 'name', 'avatar'],
        });

        // lấy ra các artist cùng thể loại
        const genreIds = artist.artistGenres.map((record) => record.genreId);

        const artistSameGenreIds = await db.ArtistGenre.findAll({
            where: {
                genreId: {
                    [Op.in]: genreIds,
                },
                artistId: {
                    [Op.not]: artist.id,
                },
            },
            attributes: ['artistId'],
        });

        const artistSameGenre = await db.Artist.findAll({
            where: {
                id: {
                    [Op.in]: artistSameGenreIds.map((record) => record.artistId),
                },
            },
            attributes: ['id', 'name', 'avatar'],
        });

        const totalSong = await db.ArtistSong.count({
            where: {
                artistId: artist.id,
                main: true,
            },
        });

        const totalFollow = await db.Follow.count({ where: { artistId: artist.id } });

        const artistDetail = {
            ...artist.toJSON(),
            // artistFeatIds: artistFeatIds,
            // songs: songs,
            // albumIds: albumIds,
            // genreIds: genreIds,
            totalSong: totalSong,
            totalFollow: totalFollow,
            popSong: popSong,
            artistAlbum: artistAlbum,
            artistSingle: artistSingle,
            artistFeat: artistFeat,
            artistSameGenre: artistSameGenre,
        };

        // Loại bỏ thuộc tính artistGenres
        const { artistGenres, ...artistDetailWithoutGenres } = artistDetail;

        return {
            errCode: 200,
            message: 'Get more artist successfully',
            artist: artistDetailWithoutGenres,
        };
    } catch (error) {
        return {
            errCode: 500,
            message: `Get more artist failed: ${error.message}`,
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

const searchArtistService = async (query, page) => {
    try {
        const limit = 10;
        const start = (page - 1) * limit;
        const end = start + limit;

        const artists = await db.Artist.findAll({ order: [['createdAt', 'DESC']] });

        const options = {
            keys: ['name'],
            threshold: 0.8,
            includeScore: true,
        };
        const fuseArtist = new Fuse(artists, options);
        const resultArtist = fuseArtist.search(query);
        const totalPage = Math.ceil(resultArtist.length / limit);

        if (page < 1 || page > totalPage) {
            return {
                errCode: 400,
                message: 'Requested page number is out of range',
            };
        }

        return {
            errCode: 200,
            message: 'Search song success',
            page: page,
            totalPage: totalPage,
            artists: resultArtist.slice(start, end),
        };
    } catch (error) {
        return {
            errCode: 500,
            message: `Search artists failed: ${error.message}`,
        };
    }
};

module.exports = {
    getAllArtistService,
    getArtistService,
    deleteArtistService,
    updateArtistService,
    createArtistService,
    getMoreArtistService,
    // ------------------
    getPopularArtistService,
    searchArtistService,
};
