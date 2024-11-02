const db = require('../models');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

// ---------------------------SONG------------------
const getAllSongService = async (offset) => {
    try {
        const songs = await db.Song.findAll({
            attributes: {
                exclude: ['albumId', 'updatedAt'],
            },
            include: [
                {
                    model: db.Album,
                    as: 'album',
                    attributes: ['albumId', 'title'],
                    include: [{ model: db.AlbumImage, as: 'albumImages', attributes: ['image', 'size'] }],
                },
                {
                    model: db.Artist,
                    as: 'artists',
                    attributes: ['id', 'name'],
                    through: {
                        attributes: ['main'],
                    },
                },
            ],
            // group: ['id'],
            order: [['createdAt', 'DESC']],
            limit: 10,
            offset: 10 * offset,
        });

        const songIds = songs.map((record) => record.id);

        const playCounts = await db.SongPlayHistory.findAll({
            attributes: ['songId', [db.Sequelize.fn('COUNT', db.Sequelize.col('historyId')), 'playCount']],
            where: {
                songId: {
                    [Op.in]: songIds,
                },
            },
            group: ['songId'],
            raw: true,
        });

        console.log('playCount', playCounts);

        const playCountMap = playCounts.reduce((acc, record) => {
            acc[record.songId] = record.playCount;
            return acc;
        }, {});

        console.log('playCountMap', playCountMap);

        const songsWithPlayCount = songs.map((song) => ({
            ...song.toJSON(),
            playCount: playCountMap[song.id] || 0,
        }));

        return {
            errCode: 200,
            message: 'Get all songs successfully',
            songs: songsWithPlayCount,
        };
    } catch (error) {
        return {
            errCode: 500,
            message: `Get all songs failed ${error.message}`,
        };
    }
};

const getSongService = async (songId) => {
    try {
        const song = await db.Song.findOne({
            where: { id: songId },
            attributes: {
                exclude: ['albumId', 'updatedAt'],
            },
            include: [
                {
                    model: db.Album,
                    as: 'album',
                    attributes: ['albumId', 'title'],
                    include: [{ model: db.AlbumImage, as: 'albumImages', attributes: ['image', 'size'] }],
                },
                {
                    model: db.Artist,
                    as: 'artists',
                    attributes: ['id', 'name'],
                    through: {
                        attributes: ['main'],
                    },
                },
            ],
        });

        if (!song) {
            return {
                errCode: 404,
                message: 'Song not found',
            };
        }

        const playCount = await db.SongPlayHistory.findAll({
            where: { songId: song.id },
            attributes: [[db.Sequelize.fn('COUNT', db.Sequelize.col('historyId')), 'playCount']],
            raw: true,
        });

        const songsWithPlayCount = {
            ...song.toJSON(),
            playCount: playCount[0].playCount || 0,
        };

        return {
            errCode: 200,
            message: 'Get song successfully',
            song: songsWithPlayCount,
        };
    } catch (error) {
        return {
            errCode: 500,
            message: `Get song failed ${error.message}`,
        };
    }
};

const deleteSongService = async (songId) => {
    try {
        const song = await db.Song.findOne({ where: { id: songId } });
        if (song) {
            await db.ArtistSong.destroy({ where: { songId: song.id } });
            await db.Song.destroy({ where: { id: song.id } });
            return {
                errCode: 200,
                message: 'Delete song success',
            };
        } else {
            return {
                errCode: 404,
                message: 'Song not found',
            };
        }
    } catch (error) {
        return {
            errCode: 500,
            message: `Delete song failed ${error.message}`,
        };
    }
};

const updateSongService = async (data) => {
    try {
        const song = await db.Song.findOne({ where: { id: data.songId } });
        if (song) {
            await db.Song.update(data.updateData, { where: { id: data.songId } });
            return {
                errCode: 200,
                message: 'Song updated successfully',
            };
        } else {
            return {
                errCode: 404,
                message: 'Song not found',
            };
        }
    } catch (error) {
        return {
            errCode: 8,
            message: `Update song failed ${error.message}`,
        };
    }
};

const createSongService = async (data) => {
    try {
        const song = await db.Song.findOne({
            where: {
                title: {
                    [Op.iLike]: `%${data.title.trim()}%`,
                },
            },
            attributes: ['title'],
            include: [
                {
                    model: db.Artist,
                    as: 'artists',
                    where: { id: data.artists[0].id },
                    attributes: ['id', 'name'],
                    through: {
                        attributes: [],
                    },
                },
            ],
        });

        if (!song) {
            if (!data.artists || data.artists.length === 0) {
                return {
                    errCode: 400,
                    errMess: 'No artists provided',
                };
            }

            const newSong = await db.Song.create({
                id: uuidv4(),
                title: data.title,
                duration: data.duration,
                lyric: data.lyric,
                filePathAudio: data.filePathAudio,
                privacy: data.privacy,
            });

            const artistSongData = data.artists
                .filter((artist) => artist.id)
                .map((artist, index) => {
                    return {
                        songId: newSong.id,
                        artistId: artist.id,
                        main: index === 0,
                    };
                });

            await db.ArtistSong.bulkCreate(artistSongData);

            return {
                errCode: 200,
                message: 'Song created successfully',
                newSong: newSong,
            };
        }

        return {
            errCode: 409,
            message: 'Song exits',
        };
    } catch (error) {
        return {
            errCode: 500,
            message: `Song creation failed: ${error.message}`,
        };
    }
};

// ---------------------------RANDOM------------------

const getSongRandomService = async () => {
    try {
        let song = await db.Song.findOne({
            attributes: {
                exclude: ['createdAt', 'updatedAt'],
            },
            include: [
                {
                    model: db.Album,
                    as: 'album',
                    attributes: ['albumId', 'title', 'releaseDate'],
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
                    attributes: ['id', 'name'],
                    through: {
                        attributes: ['main'],
                    },
                },
            ],
            order: db.Sequelize.literal('RANDOM()'),
        });

        const playCount = await db.SongPlayHistory.count({
            where: {
                songId: song.id,
            },
        });

        song = {
            ...song.toJSON(),
            playCount: playCount,
        };

        return {
            errCode: 200,
            message: 'Get song random successfully',
            song: song,
        };
    } catch (error) {
        return {
            errCode: 500,
            message: `Get song random failed: ${error.message}`,
        };
    }
};

// ---------------------------THEME MUSIC------------------

const getWeeklyTopSongsService = async (offset, user) => {
    try {
        const topSongIds = await db.SongPlayHistory.findAll({
            attributes: ['songId', [db.Sequelize.fn('COUNT', db.Sequelize.col('songId')), 'playCount']],
            where: {
                createdAt: {
                    [Op.gt]: db.Sequelize.literal("CURRENT_TIMESTAMP - INTERVAL '7 DAY'"),
                },
            },
            group: ['songId'],
            order: [[db.Sequelize.fn('COUNT', db.Sequelize.col('songId')), 'DESC']],
            limit: 10,
            offset: 10 * offset,
            raw: true,
        });

        const songIds = topSongIds.map((record) => record.songId);

        let weeklyTopSongs = await db.Song.findAll({
            where: {
                id: {
                    [Op.in]: songIds,
                },
            },
            include: [
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
                    model: db.SongPlayHistory,
                    as: 'playHistory',
                    attributes: [],
                    where: {
                        createdAt: {
                            [Op.gt]: db.Sequelize.literal("CURRENT_TIMESTAMP - INTERVAL '7 DAY'"),
                        },
                    },
                },
                {
                    model: db.Artist,
                    as: 'artists',
                    attributes: ['id', 'name'],
                    through: {
                        attributes: [],
                    },
                },
            ],
            attributes: {
                exclude: ['createdAt', 'updatedAt'],
                include: [[db.Sequelize.fn('COUNT', db.Sequelize.col('playHistory.historyId')), 'playCount']],
            },
            group: ['Song.id', 'album.albumId', 'album->albumImages.albumImageId', 'artists.id'],
            order: [[db.Sequelize.fn('COUNT', db.Sequelize.col('playHistory.historyId')), 'DESC']],
            subQuery: false,
        });

        if (user) {
            const likedSongs = await db.Like.findAll({
                where: {
                    [Op.and]: [{ songId: { [Op.in]: songIds } }, { userId: user.id }],
                },
                attributes: ['songId'],
                raw: true,
            });
            const likedSongIds = new Set(likedSongs.map((like) => like.songId));

            weeklyTopSongs = weeklyTopSongs.map((song) => ({
                ...song.toJSON(),
                liked: likedSongIds.has(song.id),
            }));

            return {
                errCode: 200,
                message: 'Get weekly top song successfully',
                weeklyTopSongs: weeklyTopSongs,
            };
        }

        return {
            errCode: 200,
            user: 'guest',
            message: 'Get weekly top song successfully',
            weeklyTopSongs: weeklyTopSongs,
        };
    } catch (error) {
        return {
            errCode: 500,
            message: `Get weekly top song failed: ${error.message}`,
        };
    }
};

const getTrendingSongsService = async (offset, user) => {
    try {
        const limit = 10;
        const start = limit * offset;
        const end = start + limit;
        const songStats = {};

        const topPlaySongIds = await db.SongPlayHistory.findAll({
            attributes: ['songId', [db.Sequelize.fn('COUNT', db.Sequelize.col('songId')), 'playCount']],
            group: ['songId'],
            raw: true,
        });

        const topLikeSongIds = await db.Like.findAll({
            attributes: ['songId', [db.Sequelize.fn('COUNT', db.Sequelize.col('songId')), 'likeCount']],
            group: ['songId'],
            raw: true,
        });

        topPlaySongIds.forEach((record) => {
            if (!songStats[record.songId]) {
                songStats[record.songId] = { playCount: 0, likeCount: 0 };
            }
            songStats[record.songId].playCount = record.playCount;
        });

        topLikeSongIds.forEach((record) => {
            if (!songStats[record.songId]) {
                songStats[record.songId] = { playCount: 0, likeCount: 0 };
            }
            songStats[record.songId].likeCount = record.likeCount;
        });

        const songIds2 = Object.keys(songStats).map((songId) => ({
            songId,
            playCount: songStats[songId].playCount,
            likeCount: songStats[songId].likeCount,
            totalCount: parseInt(songStats[songId].playCount, 10) + parseInt(songStats[songId].likeCount, 10),
        }));

        songIds2.sort((a, b) => b.totalCount - a.totalCount);

        const topSongIds = songIds2.slice(start, end).map((record) => ({
            songId: record.songId,
            likeCount: record.likeCount,
            playCount: record.playCount,
        }));

        const trendingSongs = await db.Song.findAll({
            where: {
                id: {
                    [Op.in]: topSongIds.map((song) => song.songId),
                },
            },
            include: [
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
                    attributes: ['id', 'name'],
                    through: {
                        attributes: ['main'],
                    },
                    raw: true,
                },
            ],
            attributes: {
                exclude: ['createdAt', 'updatedAt'],
            },
        });

        var trendingSongsWithCounts = topSongIds.map((rec) => {
            const song = trendingSongs.find((s) => (s.id = rec.songId));
            return {
                ...song.toJSON(),
                likeCount: rec ? rec.likeCount : 0,
                playCount: rec ? rec.playCount : 0,
            };
        });

        console.log(trendingSongsWithCounts);

        if (user) {
            const likedSongs = await db.Like.findAll({
                where: {
                    [Op.and]: [{ songId: { [Op.in]: topSongIds.map((rec) => rec.songId) } }, { userId: user.id }],
                },
                attributes: ['songId'],
                raw: true,
            });

            const likedSongIds = new Set(likedSongs.map((like) => like.songId));

            trendingSongsWithCounts = trendingSongsWithCounts.map((song) => ({
                ...song,
                liked: likedSongIds.has(song.id),
            }));

            return {
                errCode: 200,
                message: 'Get trending song successfully',
                trendingSongs: trendingSongsWithCounts,
            };
        }

        return {
            errCode: 200,
            message: 'Get trending song successfully',
            user: 'guest',
            trendingSongs: trendingSongsWithCounts,
        };
    } catch (error) {
        return {
            errCode: 500,
            message: `Get trending song failed: ${error.message}`,
        };
    }
};

const getNewReleaseSongsService = async (offset, user) => {
    try {
        const limit = 10;
        const newReleaseSongs = await db.Song.findAll({
            include: [
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
            attributes: {
                exclude: ['createdAt', 'updatedAt'],
            },
            order: [['releaseDate', 'DESC']],
            limit: limit,
            offset: limit * offset,
        });

        const songIds = newReleaseSongs.map((record) => record.id);

        const topPlaySongIds = await db.SongPlayHistory.findAll({
            where: {
                songId: {
                    [Op.in]: songIds.map((song) => song),
                },
            },
            attributes: ['songId', [db.Sequelize.fn('COUNT', db.Sequelize.col('songId')), 'playCount']],
            group: ['songId'],
            raw: true,
        });

        const topLikeSongIds = await db.Like.findAll({
            where: {
                songId: {
                    [Op.in]: songIds.map((song) => song),
                },
            },
            attributes: ['songId', [db.Sequelize.fn('COUNT', db.Sequelize.col('songId')), 'likeCount']],
            group: ['songId'],
            raw: true,
        });

        let newReleaseSongs2 = newReleaseSongs.map((song) => {
            const songData = topPlaySongIds.find((s) => s.songId === song.id);
            const songData2 = topLikeSongIds.find((s) => s.songId === song.id);

            return {
                ...song.toJSON(),
                playCount: songData ? songData.playCount : 0,
                likeCount: songData2 ? songData2.likeCount : 0,
            };
        });

        if (user) {
            const likedSongs = await db.Like.findAll({
                where: {
                    [Op.and]: [{ songId: { [Op.in]: songIds } }, { userId: user.id }],
                },
                attributes: ['songId'],
                raw: true,
            });

            const likedSongIds = new Set(likedSongs.map((like) => like.songId));

            newReleaseSongs2 = newReleaseSongs2.map((song) => ({
                ...song,
                liked: likedSongIds.has(song.id),
            }));

            return {
                errCode: 200,
                message: 'Get release song successfully',
                newReleaseSongs: newReleaseSongs2,
            };
        }

        return {
            errCode: 200,
            message: 'Get release song successfully',
            user: 'guest',
            newReleaseSongs: newReleaseSongs2,
        };
    } catch (error) {
        return {
            errCode: 500,
            message: `Get release song failed: ${error.message}`,
        };
    }
};

// ---------------------------GENRE------------------

const createGenreService = async (data) => {
    try {
        const genre = await db.Genre.findOne({ where: { name: data.name } });
        if (genre) {
            return {
                errCode: 7,
                errMess: 'Genre exits',
            };
        } else {
            data.genreId = uuidv4();
            await db.Genre.create(data);
            return {
                errCode: 0,
                errMess: 'Create genre successfully',
            };
        }
    } catch (error) {
        return {
            errCode: 8,
            errMess: `Create genre failed: ${error.message}`,
        };
    }
};

// ---------------------------ALBUM------------------

const getAllAlbumService2 = async () => {
    try {
        const albums = await db.Album.findAll({
            include: [
                {
                    model: db.Song,
                    as: 'songsAlbum',
                    attributes: {
                        include: [
                            [db.sequelize.fn('COUNT', db.sequelize.col('songsAlbum->likesSong.likeId')), 'likeCount'],
                            [
                                db.sequelize.fn('COUNT', db.sequelize.col('songsAlbum->songPlayHistories.historyId')),
                                'viewCount',
                            ],
                        ],
                    },
                    include: [
                        {
                            model: db.SongPlayHistory,
                            as: 'songPlayHistories',
                            attributes: [],
                        },
                        {
                            model: db.Like,
                            as: 'likesSong',
                            attributes: [],
                        },
                    ],
                },
            ],
            group: ['Album.albumId', 'songsAlbum.id'],
            // order: [[db.sequelize.fn('COUNT', db.sequelize.col('songsAlbum->songPlayHistories.historyId')), 'DESC']],
        });

        return {
            errCode: 0,
            errMess: 'Get all album successfully',
            albums: albums,
        };
    } catch (error) {
        return {
            errCode: 8,
            errMess: `Get all album failed: ${error}`,
        };
    }
};

const getAllAlbumService = async () => {
    try {
        const albums = await db.Album.findAll({
            include: [
                {
                    model: db.Song,
                    as: 'songsAlbum',
                    attributes: {
                        include: [
                            [db.sequelize.fn('COUNT', db.sequelize.col('songsAlbum->likesSong.likeId')), 'likeCount'],
                            [
                                db.sequelize.fn('COUNT', db.sequelize.col('songsAlbum->songPlayHistories.historyId')),
                                'viewCount',
                            ],
                        ],
                    },
                    include: [
                        {
                            model: db.SongPlayHistory,
                            as: 'songPlayHistories',
                            attributes: [],
                        },
                        {
                            model: db.Like,
                            as: 'likesSong',
                            attributes: [],
                        },
                        {
                            model: db.Artist,
                            as: 'artists',
                            attributes: ['id', 'name'],
                            through: {
                                attributes: ['main'],
                            },
                        },
                    ],
                },
                {
                    model: db.AlbumImage,
                    as: 'albumImages',
                    attributes: ['image', 'size'],
                },
            ],
            group: [
                'Album.albumId',
                'songsAlbum.id',
                'songsAlbum->artists.id',
                'songsAlbum->artists->ArtistSong.songId',
                'songsAlbum->artists->ArtistSong.artistId',
                'albumImages.id',
            ],
            // order: [[db.sequelize.fn('COUNT', db.sequelize.col('songsAlbum->songPlayHistories.historyId')), 'DESC']],
        });

        return {
            errCode: 0,
            errMess: 'Get all album successfully',
            albums: albums,
        };
    } catch (error) {
        return {
            errCode: 8,
            errMess: `Get all album failed: ${error}`,
        };
    }
};

const getAlbumPopularService = () => {};

module.exports = {
    getAllSongService,
    getSongService,
    deleteSongService,
    updateSongService,
    createSongService,
    // -------------------
    getSongRandomService,
    // -------------------
    getWeeklyTopSongsService,
    getTrendingSongsService,
    getNewReleaseSongsService,
    // ----------------
    createGenreService,
    // ----------------
    getAllAlbumService,
    getAlbumPopularService,
    // ----------------
};
