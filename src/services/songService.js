const db = require('../models');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

// ---------------------------SONG------------------
const getAllSongService = async (offset, user) => {
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
            order: [['createdAt', 'DESC']],
            limit: 10,
            offset: 10 * offset,
        });

        const playCounts = await db.SongPlayHistory.findAll({
            attributes: ['songId', [db.Sequelize.fn('COUNT', db.Sequelize.col('historyId')), 'playCount']],
            where: {
                songId: {
                    [Op.in]: songs.map((record) => record.id),
                },
            },
            group: ['songId'],
            raw: true,
        });

        const playCountMap = playCounts.reduce((map, record) => {
            map[record.songId] = record.playCount;
            return map;
        }, {});

        const likeCounts = await db.Like.findAll({
            attributes: ['songId', [db.Sequelize.fn('COUNT', db.Sequelize.col('likeId')), 'likeCount']],
            where: {
                songId: {
                    [Op.in]: songs.map((record) => record.id),
                },
            },
            group: ['songId'],
            raw: true,
        });

        const likeCountsMap = likeCounts.reduce((map, item) => {
            map[item.songId] = item.likeCount;
            return map;
        }, {});

        let likedSongIds = [];
        if (user) {
            const likedSongs = await db.Like.findAll({
                where: {
                    [Op.and]: [{ songId: { [Op.in]: songs.map((s) => s.id) } }, { userId: user.id }],
                },
                attributes: ['songId'],
                raw: true,
            });

            likedSongIds = likedSongs.map((ls) => ls.songId);
        }

        const allSongs = songs.map((song) => ({
            ...song.toJSON(),
            playCount: playCountMap[song.id] || 0,
            likeCount: likeCountsMap[song.id] || 0,
            liked: user && likedSongIds.includes(song.id),
        }));

        return {
            errCode: 200,
            message: 'Get all songs successfully',
            songs: allSongs,
        };
    } catch (error) {
        return {
            errCode: 500,
            message: `Get all songs failed ${error.message}`,
        };
    }
};

const getSongService = async (songId, user) => {
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

        const playCount = await db.SongPlayHistory.findOne({
            where: { songId: song.id },
            attributes: [[db.Sequelize.fn('COUNT', db.Sequelize.col('historyId')), 'playCount']],
            raw: true,
        });

        const likeCount = await db.Like.findOne({
            where: {
                songId: songId,
            },
            attributes: [[db.Sequelize.fn('COUNT', db.Sequelize.col('likeId')), 'likeCount']],
            raw: true,
        });

        let likedSongIds = [];
        if (user) {
            const likedSongs = await db.Like.findOne({
                where: {
                    [Op.and]: [{ songId: songId }, { userId: user.id }],
                },
                attributes: ['songId'],
                raw: true,
            });

            if (likedSongs) {
                likedSongIds.push(likedSongs.songId);
            }
        }

        const songData = {
            ...song.toJSON(),
            playCount: playCount.playCount || 0,
            likeCount: likeCount.likeCount || 0,
            liked: user && likedSongIds.includes(songId),
        };

        return {
            errCode: 200,
            message: 'Get song successfully',
            song: songData,
        };
    } catch (error) {
        return {
            errCode: 500,
            message: `Get song failed ${error.message}`,
        };
    }
};

const getOtherSongByArtistService = async (artistId, offset, user) => {
    try {
        const songIds = await db.ArtistSong.findAll({
            where: {
                artistId: artistId,
                main: true,
            },
            attributes: ['songId', 'createdAt'],
            order: [['createdAt', 'DESC']],
            limit: 10,
            offset: 10 * offset,
            raw: true,
        });

        // nhac , artist, ảnh, album, view, like

        const songInfo = await db.Song.findAll({
            where: {
                id: {
                    [Op.in]: songIds.map((s) => s.songId),
                },
            },
            attributes: ['id', 'title', 'duration', 'lyric', 'filePathAudio', 'releaseDate'],
            include: [
                {
                    model: db.Album,
                    as: 'album',
                    attributes: ['albumId', 'title', 'releaseDate', 'albumType'],
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
        });

        const viewCount = await db.SongPlayHistory.findAll({
            where: {
                songId: {
                    [Op.in]: songIds.map((s) => s.songId),
                },
            },
            attributes: ['songId', [db.Sequelize.fn('COUNT', db.Sequelize.col('historyId')), 'viewCount']],
            group: ['songId'],
            raw: true,
        });

        const viewCountMap = viewCount.reduce((map, item) => {
            map[item.songId] = item.viewCount;
            return map;
        }, {});

        const likeCount = await db.Like.findAll({
            where: {
                songId: {
                    [Op.in]: songIds.map((s) => s.songId),
                },
            },
            attributes: ['songId', [db.Sequelize.fn('COUNT', db.Sequelize.col('likeId')), 'likeCount']],
            group: ['songId'],
            raw: true,
        });

        const likeCountMap = likeCount.reduce((map, item) => {
            map[item.songId] = item.likeCount;
            return map;
        }, {});

        let likedSongIds = [];
        if (user) {
            const likedSongs = await db.Like.findAll({
                where: {
                    [Op.and]: [{ songId: { [Op.in]: songIds.map((s) => s.songId) } }, { userId: user.id }],
                },
                attributes: ['songId'],
                raw: true,
            });

            likedSongIds = likedSongs.map((ls) => ls.songId);
        }

        const songOther = songIds.map((s) => {
            const song = songInfo.find((f) => f.id === s.songId);
            return {
                ...song.toJSON(),
                viewCount: viewCountMap[s.songId] || 0,
                likeCount: likeCountMap[s.songId] || 0,
                liked: user && likedSongIds.includes(s.songId),
            };
        });

        return {
            errCode: 200,
            message: 'Get other song by artist success',
            user: user ? 'user' : 'guest',
            songs: songOther,
        };
    } catch (error) {
        return {
            errCode: 500,
            message: `Get other song by artist failed ${error.message}`,
        };
    }
};

const getSongOtherArtistService = async (artistId, offset, user) => {
    try {
        const songIds = await db.ArtistSong.findAll({
            where: {
                artistId: artistId,
                main: false,
            },
            attributes: ['songId'],
            raw: true,
        });

        const songInfo = await db.Song.findAll({
            where: {
                id: {
                    [Op.in]: songIds.map((s) => s.songId),
                },
            },
            attributes: ['id', 'title', 'duration', 'lyric', 'filePathAudio', 'releaseDate'],
            include: [
                {
                    model: db.Album,
                    as: 'album',
                    attributes: ['albumId', 'title', 'releaseDate', 'albumType'],
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
        });

        const viewCount = await db.SongPlayHistory.findAll({
            where: {
                songId: {
                    [Op.in]: songIds.map((s) => s.songId),
                },
            },
            attributes: ['songId', [db.Sequelize.fn('COUNT', db.Sequelize.col('historyId')), 'viewCount']],
            group: ['songId'],
            raw: true,
        });

        const viewCountMap = viewCount.reduce((map, item) => {
            map[item.songId] = item.viewCount;
            return map;
        }, {});

        const likeCount = await db.Like.findAll({
            where: {
                songId: {
                    [Op.in]: songIds.map((s) => s.songId),
                },
            },
            attributes: ['songId', [db.Sequelize.fn('COUNT', db.Sequelize.col('likeId')), 'likeCount']],
            group: ['songId'],
            raw: true,
        });

        const likeCountMap = likeCount.reduce((map, item) => {
            map[item.songId] = item.likeCount;
            return map;
        }, {});

        let likedSongIds = [];
        if (user) {
            const likedSongs = await db.Like.findAll({
                where: {
                    [Op.and]: [{ songId: { [Op.in]: songIds.map((s) => s.songId) } }, { userId: user.id }],
                },
                attributes: ['songId'],
                raw: true,
            });

            likedSongIds = likedSongs.map((ls) => ls.songId);
        }

        const songOther = songIds.map((s) => {
            const song = songInfo.find((f) => f.id === s.songId);
            return {
                ...song.toJSON(),
                viewCount: viewCountMap[s.songId] || 0,
                likeCount: likeCountMap[s.songId] || 0,
                liked: user && likedSongIds.includes(s.songId),
            };
        });

        return {
            errCode: 200,
            message: 'Get song other artist success',
            user: user ? 'user' : 'guest',
            songs: songOther,
        };
    } catch (error) {
        return {
            errCode: 500,
            message: `Get song other artist failed ${error.message}`,
        };
    }
};

const getSongSameGenreService = async (artistId, offset, user) => {
    try {
        const genreIds = await db.ArtistGenre.findAll({
            where: {
                artistId: artistId,
            },
            attributes: ['genreId'],
            raw: true,
        });

        const artistIds = await db.ArtistGenre.findAll({
            where: {
                [Op.and]: [
                    { artistId: { [Op.not]: artistId } },
                    { genreId: { [Op.in]: genreIds.map((g) => g.genreId) } },
                ],
            },
            attributes: ['artistId'],
            raw: true,
        });

        const songIds = await db.ArtistSong.findAll({
            where: {
                artistId: { [Op.in]: artistIds.map((a) => a.artistId) },
            },
            attributes: ['songId'],
            raw: true,
        });

        const songs = await db.Song.findAll({
            where: {
                id: { [Op.in]: songIds.map((s) => s.songId) },
            },
            attributes: ['id', 'title', 'duration', 'lyric', 'filePathAudio', 'releaseDate'],
            include: [
                {
                    model: db.Album,
                    as: 'album',
                    attributes: ['albumId', 'title', 'releaseDate', 'albumType'],
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
                    include: [
                        { model: db.Genre, as: 'genres', attributes: ['genreId', 'name'], through: { attributes: [] } },
                    ],
                },
            ],
            order: [['releaseDate', 'DESC']],
            limit: 10,
            offset: 10 * offset,
        });

        const viewCount = await db.SongPlayHistory.findAll({
            where: {
                songId: {
                    [Op.in]: songs.map((s) => s.id),
                },
            },
            attributes: ['songId', [db.Sequelize.fn('COUNT', db.Sequelize.col('historyId')), 'viewCount']],
            group: ['songId'],
            raw: true,
        });

        const viewCountMap = viewCount.reduce((map, item) => {
            map[item.songId] = item.viewCount;
            return map;
        }, {});

        const likeCount = await db.Like.findAll({
            where: {
                songId: {
                    [Op.in]: songs.map((s) => s.id),
                },
            },
            attributes: ['songId', [db.Sequelize.fn('COUNT', db.Sequelize.col('likeId')), 'likeCount']],
            group: ['songId'],
            raw: true,
        });

        const likeCountMap = likeCount.reduce((map, item) => {
            map[item.songId] = item.likeCount;
            return map;
        }, {});

        let likedSongIds = [];
        if (user) {
            const likedSongs = await db.Like.findAll({
                where: {
                    [Op.and]: [{ songId: { [Op.in]: songs.map((s) => s.id) } }, { userId: user.id }],
                },
                attributes: ['songId'],
                raw: true,
            });

            likedSongIds = likedSongs.map((ls) => ls.songId);
        }

        const songOther = songs.map((s) => {
            return {
                ...s.toJSON(),
                genre: s.toJSON().artists.flatMap((artist) => artist.genres) || [],
                viewCount: viewCountMap[s.id] || 0,
                likeCount: likeCountMap[s.id] || 0,
                liked: user && likedSongIds.includes(s.id),
            };
        });

        return {
            errCode: 200,
            message: 'Get song same genre success',
            user: user ? 'user' : 'guest',
            songs: songOther,
        };
    } catch (error) {
        return {
            errCode: 500,
            message: `Get song same genre failed ${error.message}`,
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

        const songs = await db.Song.findAll({
            where: {
                id: {
                    [Op.in]: topSongIds.map((record) => record.songId),
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
                },
            ],
            attributes: ['id', 'title', 'releaseDate', 'duration', 'lyric', 'filePathAudio'],
        });

        let weeklyTopSongs = topSongIds.map((t) => {
            const song = songs.find((s) => s.id === t.songId);
            return {
                ...song.toJSON(),
                playCount: t.playCount,
            };
        });

        if (user) {
            const likedSongs = await db.Like.findAll({
                where: {
                    [Op.and]: [{ songId: { [Op.in]: topSongIds.map((record) => record.songId) } }, { userId: user.id }],
                },
                attributes: ['songId'],
                raw: true,
            });
            const likedSongIds = new Set(likedSongs.map((like) => like.songId));

            weeklyTopSongs = weeklyTopSongs.map((song) => ({
                ...song,
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
            // attributes: {
            //     exclude: ['createdAt', 'updatedAt'],
            // },
            attributes: ['id', 'title', 'releaseDate', 'duration', 'lyric', 'filePathAudio'],
        });

        let trendingSongsWithCounts = topSongIds.map((rec) => {
            const song = trendingSongs.find((s) => (s.id = rec.songId));
            return {
                ...song.toJSON(),
                likeCount: rec ? rec.likeCount : 0,
                playCount: rec ? rec.playCount : 0,
            };
        });

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

            // return {
            //     errCode: 200,
            //     message: 'Get trending song successfully',
            //     trendingSongs: trendingSongsWithCounts,
            // };
        }

        return {
            errCode: 200,
            message: 'Get trending song successfully',
            user: user ? 'user' : 'guest',
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
            // attributes: {
            //     exclude: ['createdAt', 'updatedAt'],
            // },
            attributes: ['id', 'title', 'releaseDate', 'duration', 'lyric', 'filePathAudio'],
            order: [['releaseDate', 'DESC']],
            limit: limit,
            offset: limit * offset,
        });

        // const songIds = newReleaseSongs.map((record) => record.id);

        const playCountSong = await db.SongPlayHistory.findAll({
            where: {
                songId: {
                    [Op.in]: newReleaseSongs.map((record) => record.id),
                },
            },
            attributes: ['songId', [db.Sequelize.fn('COUNT', db.Sequelize.col('songId')), 'playCount']],
            group: ['songId'],
            raw: true,
        });

        const likeCountSong = await db.Like.findAll({
            where: {
                songId: {
                    [Op.in]: newReleaseSongs.map((record) => record.id),
                },
            },
            attributes: ['songId', [db.Sequelize.fn('COUNT', db.Sequelize.col('songId')), 'likeCount']],
            group: ['songId'],
            raw: true,
        });

        let newReleaseSongs2 = newReleaseSongs.map((song) => {
            const songData = playCountSong.find((s) => s.songId === song.id);
            const songData2 = likeCountSong.find((s) => s.songId === song.id);

            return {
                ...song.toJSON(),
                playCount: songData ? songData.playCount : 0,
                likeCount: songData2 ? songData2.likeCount : 0,
            };
        });

        if (user) {
            const likedSongs = await db.Like.findAll({
                where: {
                    [Op.and]: [
                        { songId: { [Op.in]: newReleaseSongs.map((record) => record.id) } },
                        { userId: user.id },
                    ],
                },
                attributes: ['songId'],
                raw: true,
            });

            const likedSongIds = new Set(likedSongs.map((like) => like.songId));

            newReleaseSongs2 = newReleaseSongs2.map((song) => ({
                ...song,
                liked: likedSongIds.has(song.id),
            }));

            // return {
            //     errCode: 200,
            //     message: 'Get release song successfully',
            //     newReleaseSongs: newReleaseSongs2,
            // };
        }

        return {
            errCode: 200,
            message: 'Get release song successfully',
            user: user ? 'user' : 'guest',
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

// ---------------------------COMMENT------------------

const getCommentSongService = async (songId, page, user) => {
    try {
        const limit = 5;
        const skip = (page - 1) * limit;
        const totalComment = await db.Comment.count({ where: { songId: songId, commentParentId: { [Op.is]: null } } });
        const totalPage = Math.ceil(totalComment / limit);

        if (page > totalPage || page < 1) {
            return {
                errCode: 400,
                message: 'Requested page number is out of range',
            };
        }

        const song = await db.Song.findByPk(songId);
        if (!song) {
            return {
                errCode: 404,
                message: 'Song not found',
            };
        }
        const comments = await db.Comment.findAll({
            where: {
                [Op.and]: [{ songId: songId }, { commentParentId: null }],
            },
            include: [
                {
                    model: db.User,
                    as: 'user',
                    attributes: ['id', 'username', 'image', 'accountType'],
                },
            ],
            attributes: ['id', 'commentParentId', 'userId', 'content', 'createdAt'],
            order: [['createdAt', 'DESC']],
            limit: limit,
            offset: skip,
        });

        const checkCommentChild = await db.Comment.findAll({
            where: {
                commentParentId: {
                    [Op.in]: comments.map((rec) => rec.id),
                },
            },
            attributes: ['commentParentId', [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'totalComment']],
            group: ['Comment.commentParentId'],
            raw: true,
        });

        const checkHasChild = comments.map((rec) => {
            const child = checkCommentChild.find((c) => c.commentParentId === rec.id);
            return {
                ...rec.toJSON(),
                hasChild: (child && child.totalComment) || 0,
                myComment: user && rec.userId === user.id,
            };
        });

        const totalCommentOfSong = await db.Comment.count({ where: { songId: songId } });

        return {
            errCode: 200,
            message: 'Get comment success',
            user: user ? 'user' : 'guest',
            page: page,
            totalPage: totalPage,
            totalComment: totalCommentOfSong,
            comments: checkHasChild,
        };
    } catch (error) {
        return {
            errCode: 500,
            errMess: `Get comment failed: ${error}`,
        };
    }
};

const getCommentChildService = async (parentId, page, user) => {
    try {
        const limit = 5;
        const skip = (page - 1) * limit;
        const totalComment = await db.Comment.count({ where: { commentParentId: parentId } });
        const totalPage = Math.ceil(totalComment / limit);

        if (page > totalPage || page < 1) {
            return {
                errCode: 400,
                message: 'Requested page number is out of range',
            };
        }

        const comments = await db.Comment.findAll({
            where: {
                commentParentId: parentId,
            },
            attributes: ['id', 'commentParentId', 'userId', 'content', 'createdAt'],
            include: [
                {
                    model: db.User,
                    as: 'user',
                    attributes: ['id', 'username', 'image', 'accountType'],
                },
            ],
            order: [['createdAt', 'DESC']],
            limit: limit,
            offset: skip,
        });

        const checkHasChild = comments.map((rec) => {
            return {
                ...rec.toJSON(),
                myComment: user && rec.userId === user.id,
            };
        });

        return {
            errCode: 200,
            message: 'Get comment success',
            user: user ? 'user' : 'guest',
            page: page,
            totalPage: totalPage,
            comments: checkHasChild,
        };
    } catch (error) {
        return {
            errCode: 500,
            errMess: `Get comment child failed: ${error}`,
        };
    }
};

const updateCommentService = async (data, user) => {
    try {
    } catch (error) {}
};

const getWeeklyTopSongsService2 = async (page, user) => {
    try {
        const limit = 10;
        const start = (page - 1) * limit;
        const end = start + limit;

        const songWithPlayCount = await db.SongPlayHistory.findAll({
            attributes: ['songId', [db.Sequelize.fn('COUNT', db.Sequelize.col('songId')), 'playCount']],
            where: { createdAt: { [Op.gt]: db.Sequelize.literal("CURRENT_TIMESTAMP - INTERVAL '7 DAY'") } },
            group: ['songId'],
            order: [
                [db.Sequelize.fn('COUNT', db.Sequelize.col('songId')), 'DESC'],
                ['songId', 'DESC'],
            ],
            raw: true,
        });

        const totalSong = songWithPlayCount.length;
        const totalPage = Math.ceil(totalSong / limit);

        if (page < 1 || page > totalPage) {
            return {
                errCode: 400,
                message: 'Requested page number is out of range',
            };
        }

        const songIds = songWithPlayCount.slice(start, end);

        const songs = await db.Song.findAll({
            where: { id: { [Op.in]: songIds.map((s) => s.songId) } },
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
                    through: { attributes: ['main'] },
                },
            ],
            attributes: ['id', 'title', 'releaseDate', 'duration', 'lyric', 'filePathAudio'],
        });

        const likeCount = await db.Like.findAll({
            where: { songId: { [Op.in]: songIds.map((s) => s.songId) } },
            attributes: ['songId', [db.Sequelize.fn('COUNT', db.Sequelize.col('likeId')), 'likeCount']],
            group: ['songId'],
            raw: true,
        });

        let checkLike;
        if (user) {
            checkLike = await db.Like.findAll({
                where: { [Op.and]: [{ songId: { [Op.in]: songIds.map((s) => s.songId) } }, { userId: user.id }] },
                attributes: ['songId'],
                raw: true,
            });
        }

        const result = songIds.map((rec) => {
            const song = songs.find((s) => s.id === rec.songId);
            return {
                ...song.toJSON(),
                playCount: rec.playCount,
                likeCount: likeCount.find((l) => l.songId === rec.songId).likeCount,
                liked: user && checkLike.some((l) => l.songId === rec.songId),
            };
        });

        return {
            errCode: 200,
            page: page,
            totalPage: totalPage,
            data: result,
        };
    } catch (error) {
        return {
            errCode: 500,
            errMess: `Get failed: ${error}`,
        };
    }
};

module.exports = {
    getAllSongService,
    getSongService,
    getOtherSongByArtistService,
    getSongOtherArtistService,
    getSongSameGenreService,
    // getMoreSongService,
    deleteSongService,
    updateSongService,
    createSongService,
    // -------------------
    getSongRandomService,
    // -------------------
    getWeeklyTopSongsService,
    getWeeklyTopSongsService2,
    getTrendingSongsService,
    getNewReleaseSongsService,
    // ----------------
    createGenreService,
    // ----------------
    getAllAlbumService,
    getAlbumPopularService,
    // ----------------
    getCommentSongService,
    getCommentChildService,
    updateCommentService,
};
