import db from '~/models';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { artistSongService } from './artistSongService';
import { commentService } from './commentService';
import formatTime from '~/utils/timeFormat';
import encodeData from '~/utils/encryption';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError';
const Fuse = require('fuse.js');

const fetchSongs = async ({
    limit = undefined,
    offset = undefined,
    conditions = {},
    order = [['createdAt', 'DESC']],
    additionalAttributes = [],
    group = [],
    mode = 'findAll', // or findOne
    role,
} = {}) => {
    try {
        const [songs, totalPlay, totalComment, totalLike, totalDownload] = await Promise.all([
            db.Song[mode]({
                attributes: [
                    'id',
                    'title',
                    'releaseDate',
                    'duration',
                    'lyric',
                    'filePathAudio',
                    'createdAt',
                    ...additionalAttributes,
                ],
                include: [
                    {
                        model: db.Album,
                        as: 'album',
                        attributes: ['albumId', 'title', 'albumType', 'releaseDate'],
                        through: { attributes: [] },
                        include: [{ model: db.AlbumImage, as: 'albumImages', attributes: ['image', 'size'] }],
                    },
                    {
                        model: db.Artist,
                        as: 'artists',
                        attributes: ['id', 'name'],
                        through: { attributes: ['main'] },
                        include: [
                            {
                                model: db.Genre,
                                as: 'genres',
                                attributes: ['genreId', 'name'],
                                through: { attributes: [] },
                            },
                        ],
                    },
                    {
                        model: db.SongPlayHistory,
                        as: 'playHistory',
                        attributes: [],
                    },
                ],
                where: conditions,
                limit: limit,
                offset: offset,
                order: order,
                group: group,
                // subQuery: false,
            }),
            db.SongPlayHistory.findAll({
                attributes: ['songId', [db.Sequelize.fn('COUNT', db.Sequelize.col('songId')), 'totalPlay']],
                group: ['songId'],
                raw: true,
            }),
            db.Comment.findAll({
                attributes: ['songId', [db.Sequelize.fn('COUNT', db.Sequelize.col('songId')), 'totalComment']],
                group: ['songId'],
                raw: true,
            }),
            db.Like.findAll({
                attributes: ['songId', [db.Sequelize.fn('COUNT', db.Sequelize.col('songId')), 'totalLike']],
                group: ['songId'],
                raw: true,
            }),
            db.Download.findAll({
                attributes: ['songId', [db.Sequelize.fn('COUNT', db.Sequelize.col('songId')), 'totalDownload']],
                group: ['songId'],
                raw: true,
            }),
        ]);

        const totalPlayMap = totalPlay.reduce((acc, curr) => {
            acc[curr.songId] = curr.totalPlay;
            return acc;
        }, {});
        const totalCommentMap = totalComment.reduce((acc, curr) => {
            acc[curr.songId] = curr.totalComment;
            return acc;
        }, {});
        const totalLikeMap = totalLike.reduce((acc, curr) => {
            acc[curr.songId] = curr.totalLike;
            return acc;
        }, {});
        const totalDownloadMap = totalDownload.reduce((acc, curr) => {
            acc[curr.songId] = curr.totalDownload;
            return acc;
        }, {});

        if (mode === 'findAll') {
            const formattedSongs = songs.map((song) => {
                const formattedSong = { ...song.toJSON() };
                formattedSong.createdAt = formatTime(formattedSong.createdAt);
                formattedSong.releaseDate = formatTime(formattedSong.releaseDate);
                formattedSong.filePathAudio = encodeData(formattedSong.filePathAudio);
                if (role === 'Admin') {
                    formattedSong.lyric = formattedSong.lyric;
                } else {
                    formattedSong.lyric = formattedSong.lyric ? encodeData(formattedSong.lyric) : null;
                }
                formattedSong.totalPlay = totalPlayMap[formattedSong.id] ?? 0;
                formattedSong.totalComment = totalCommentMap[formattedSong.id] ?? 0;
                formattedSong.totalLike = totalLikeMap[formattedSong.id] ?? 0;
                formattedSong.totalDownload = totalDownloadMap[formattedSong.id] ?? 0;
                formattedSong.album.map((a) => (a.releaseDate = formatTime(a.releaseDate)));
                return formattedSong;
            });
            return formattedSongs;
        } else if (mode === 'findOne') {
            if (!songs) {
                return null;
            }
            const formattedSong = songs.toJSON();
            formattedSong.createdAt = formatTime(formattedSong.createdAt);
            formattedSong.releaseDate = formatTime(formattedSong.releaseDate);
            formattedSong.filePathAudio = encodeData(formattedSong.filePathAudio);
            if (role && role === 'Admin') {
                formattedSong.lyric = formattedSong.lyric;
            } else {
                formattedSong.lyric = formattedSong.lyric ? encodeData(formattedSong.lyric) : null;
            }
            formattedSong.totalPlay = totalPlayMap[formattedSong.id] ?? 0;
            formattedSong.totalComment = totalCommentMap[formattedSong.id] ?? 0;
            formattedSong.totalLike = totalLikeMap[formattedSong.id] ?? 0;
            formattedSong.totalDownload = totalDownload[formattedSong.id] ?? 0;
            formattedSong.album.map((a) => (a.releaseDate = formatTime(a.releaseDate)));
            return formattedSong;
        }
    } catch (error) {
        throw error;
    }
};

const checkSongExists = async (songId) => {
    return await db.Song.findByPk(songId);
};

const fetchSongPlayCount = async ({ limit = undefined, offset = undefined, conditions = {}, order = 'DESC' } = {}) => {
    const songWithPlayCount = await db.SongPlayHistory.findAll({
        attributes: ['songId', [db.Sequelize.fn('COUNT', db.Sequelize.col('songId')), 'playCount']],
        where: conditions,
        group: ['songId'],
        order: [[db.Sequelize.fn('COUNT', db.Sequelize.col('songId')), order]],
        limit: limit,
        offset: offset,
        raw: true,
    });
    return songWithPlayCount;
};

const fetchSongLikeCount = async ({ limit = undefined, offset = undefined, conditions = {}, order = 'DESC' } = {}) => {
    const songWithLikeCount = await db.Like.findAll({
        attributes: ['songId', [db.Sequelize.fn('COUNT', db.Sequelize.col('likeId')), 'likeCount']],
        where: conditions,
        group: ['songId'],
        order: [[db.Sequelize.fn('COUNT', db.Sequelize.col('likeId')), order]],
        limit: limit,
        offset: offset,
        raw: true,
    });
    return songWithLikeCount;
};

const fetchUserLikedSong = async ({ userId, songIds, conditions = {} } = {}) => {
    const likedSongs = db.Like.findAll({
        where: conditions,
        attributes: ['songId'],
        raw: true,
    });
    return likedSongs;
};

const fetchSongCount = async () => {
    return await db.Song.count();
};

const checkCommentExists = async (commentId) => {
    return await db.Comment.findByPk(commentId);
};

const calculateTotalPages = (totalItems, limit) => {
    return Math.ceil(totalItems / limit);
};

// --------------------------------------------
const getAllSongService = async ({ page = 1, limit = 10 } = {}) => {
    try {
        const offset = (page - 1) * limit;

        const [totalSong, songs] = await Promise.all([
            db.Song.count({ where: { privacy: false } }),
            fetchSongs({ limit: limit, offset: offset, conditions: { privacy: false }, role: 'Admin' }),
        ]);

        const result = songs.map((s) => {
            const { album, artists, ...other } = s;

            return {
                ...other,
                album: album ?? null,
                artists: artists.map(({ ArtistSong, ...otherArtist }) => ({
                    ...otherArtist,
                    main: ArtistSong?.main ?? false,
                })),
            };
        });
        return {
            page: page,
            totalPage: Math.ceil(totalSong / limit),
            song: result,
        };
    } catch (error) {
        throw error;
    }
};

const getSongService = async (songId, user) => {
    try {
        const [song, likedSongs] = await Promise.all([
            fetchSongs({ conditions: { id: songId, privacy: false }, mode: 'findOne', role: 'Admin' }),
            user && db.Like.findOne({ where: { songId: songId, userId: user.id }, raw: true }),
        ]);

        if (!song) throw new ApiError(StatusCodes.NOT_FOUND, 'Song not found');

        const { totalPlay, totalLike, ...otherSong } = song;
        const songData = {
            ...otherSong,
            playCount: totalPlay,
            likeCount: totalLike,
        };

        if (user) {
            const liked = likedSongs ? true : false;
            songData.liked = liked;
        }

        return songData;
    } catch (error) {
        throw error;
    }
};

const getWeeklyTopSongsService = async ({ page = 1, limit = 10, user } = {}) => {
    try {
        const start = (page - 1) * limit;
        const end = start + limit;

        const songIds = await db.SongPlayHistory.findAll({
            where: { createdAt: { [Op.gt]: db.Sequelize.literal("CURRENT_TIMESTAMP - INTERVAL '100 DAY'") } },
            attributes: ['songId', [db.Sequelize.fn('COUNT', db.Sequelize.col('songId')), 'playCount']],
            group: ['songId'],
            raw: true,
        });

        const topSongIds = songIds
            .sort((a, b) => {
                return b.playCount - a.playCount;
            })
            .slice(start, end);

        const [songs, likedSongs] = await Promise.all([
            fetchSongs({ conditions: { id: { [Op.in]: topSongIds.map((rec) => rec.songId) }, privacy: false } }),
            user &&
                db.Like.findAll({
                    where: { songId: { [Op.in]: topSongIds?.map((rec) => rec.songId) }, userId: user.id },
                }),
        ]);

        const songsMap = songs.reduce((map, record) => {
            map[record.id] = record;
            return map;
        }, {});

        const likedSongsMap = new Set(likedSongs?.map((like) => like.songId));

        const weeklyTopSongs = topSongIds.map((s) => {
            const song = songsMap[s.songId];
            const { totalPlay, totalComment, totalLike, totalDownload, ...other } = song;
            let liked = false;
            const result = {
                ...other,
                playCount: s.playCount,
            };
            if (user) {
                liked = likedSongsMap.has(s.songId) ? true : false;
                result.liked = liked;
            }
            return result;
        });

        return {
            page: page,
            totalPage: Math.ceil(songIds.length / limit),
            weeklyTopSongs: weeklyTopSongs,
        };
    } catch (error) {
        throw error;
    }
};

const getTrendingSongsService = async ({ page = 1, limit = 10, user } = {}) => {
    try {
        const start = (page - 1) * limit;
        const end = start + limit;

        const [topPlaySongIds, topLikeSongIds] = await Promise.all([fetchSongPlayCount(), fetchSongLikeCount()]);

        const songStats = topPlaySongIds.concat(topLikeSongIds).reduce((acc, record) => {
            const songId = record.songId;
            if (!acc[songId]) {
                acc[songId] = { playCount: 0, likeCount: 0, total: 0 };
            }
            if (record.playCount) {
                acc[songId].playCount = record.playCount;
            }
            if (record.likeCount) {
                acc[songId].likeCount = record.likeCount;
            }
            acc[songId].total = parseInt(acc[songId].playCount) + parseInt(acc[songId].likeCount);
            return acc;
        }, {});

        const sortedSongStats = Object.entries(songStats)
            .map(([songId, stats]) => ({ songId, ...stats }))
            .sort((a, b) => b.total - a.total)
            .slice(start, end);

        const [songs, likedSongs] = await Promise.all([
            fetchSongs({
                conditions: {
                    id: {
                        [Op.in]: sortedSongStats.map((song) => song.songId),
                    },
                    privacy: false,
                },
            }),
            user &&
                db.Like.findAll({
                    where: { songId: { [Op.in]: sortedSongStats?.map((rec) => rec.songId) }, userId: user.id },
                }),
        ]);

        const songsMap = songs.reduce((map, record) => {
            map[record.id] = record;
            return map;
        }, {});

        const likedSongsMap = new Set(likedSongs?.map((like) => like.songId));

        const trendingSongs = sortedSongStats.map((s) => {
            const song = songsMap[s.songId];
            const { totalPlay, totalLike, ...other } = song;
            const result = {
                ...other,
                playCount: totalPlay,
                likeCount: totalLike,
                totalCount: parseInt(totalPlay) + parseInt(totalLike),
            };
            if (user) {
                const liked = likedSongsMap.has(s.songId) ? true : false;
                result.liked = liked;
            }
            return result;
        });

        return {
            page: page,
            totalPage: Math.ceil(Object.keys(songStats).length / limit),
            trendingSongs: trendingSongs,
        };
    } catch (error) {
        throw error;
    }
};

const getNewReleaseSongsService = async ({ page = 1, limit = 10, user } = {}) => {
    try {
        const offset = (page - 1) * limit;

        const newReleaseSongs = await fetchSongs({ limit: limit, offset: offset, order: [['releaseDate', 'DESC']] });

        const [likedSongs, totalSong] = await Promise.all([
            user &&
                db.Like.findAll({
                    where: { songId: { [Op.in]: newReleaseSongs?.map((rec) => rec.songId) }, userId: user.id },
                }),
            db.Song.count({ where: { privacy: false } }),
        ]);

        const likedSongsMap = new Set(likedSongs?.map((like) => like.songId));

        const newRaleaseSongMap = newReleaseSongs.map((s) => {
            const { totalPlay, totalLike, ...other } = s;
            const result = {
                ...other,
                playCount: totalPlay,
                likeCount: totalLike,
            };
            if (user) {
                const liked = likedSongsMap.has(s.songId) ? true : false;
                result.liked = liked;
            }
            return result;
        });
        return {
            page: page,
            totalPage: Math.ceil(totalSong / limit),
            newReleaseSongs: newRaleaseSongMap,
        };
    } catch (error) {
        throw error;
    }
};

const getOtherSongByArtistService = async ({ artistId, page = 1, limit = 10, user } = {}) => {
    try {
        const start = (page - 1) * limit;
        const end = start + limit;

        const allSongIds = await artistSongService.fetchSongIdsByArtist({
            conditions: { artistId: artistId, main: true },
        });
        const allSongIdsSet = Array.from(new Map(allSongIds.map((item) => [item.songId, item])).values());
        const songIds = allSongIdsSet.slice(start, end);

        const [songs, likedSongs] = await Promise.all([
            fetchSongs({ conditions: { id: { [Op.in]: songIds.map((s) => s.songId) }, privacy: false } }),
            user &&
                db.Like.findAll({
                    where: { songId: { [Op.in]: songIds?.map((rec) => rec.songId) }, userId: user.id },
                }),
        ]);

        const songsMap = songs.reduce((map, record) => {
            map[record.id] = record;
            return map;
        }, {});

        const likedSongsMap = new Set(likedSongs?.map((like) => like.songId));

        const songOther = songIds.map((s) => {
            const song = songsMap[s.songId];
            const { totalPlay, totalLike, ...other } = song;
            const result = {
                ...other,
                viewCount: totalPlay,
                likeCount: totalLike,
            };
            if (user) {
                const liked = likedSongsMap.has(s.songId) ? true : false;
                result.liked = liked;
            }
            return result;
        });

        return {
            page: page,
            totalPage: Math.ceil(allSongIdsSet.length / limit),
            songs: songOther,
        };
    } catch (error) {
        throw error;
    }
};

const getSongOtherArtistService = async ({ artistId, page = 1, limit = 10, user } = {}) => {
    try {
        const start = (page - 1) * limit;
        const end = start + limit;

        const allSongIds = await artistSongService.fetchSongIdsByArtist({
            conditions: { artistId: artistId, main: false },
        });

        const allSongIdsSet = Array.from(new Map(allSongIds.map((item) => [item.songId, item])).values());
        const songIds = allSongIdsSet.slice(start, end);

        const [songs, likedSongs] = await Promise.all([
            fetchSongs({ conditions: { id: { [Op.in]: songIds.map((s) => s.songId) }, privacy: false } }),
            user &&
                db.Like.findAll({
                    where: { songId: { [Op.in]: songIds?.map((rec) => rec.songId) }, userId: user.id },
                }),
        ]);

        const songsMap = songs.reduce((map, record) => {
            map[record.id] = record;
            return map;
        }, {});

        const likedSongsMap = new Set(likedSongs?.map((like) => like.songId));

        const songOther = songIds.map((s) => {
            const song = songsMap[s.songId];
            const { totalPlay, totalLike, ...other } = song;
            const result = {
                ...other,
                viewCount: totalPlay,
                likeCount: totalLike,
            };
            if (user) {
                const liked = likedSongsMap.has(s.songId) ? true : false;
                result.liked = liked;
            }
            return result;
        });

        return {
            page: page,
            totalPage: Math.ceil(allSongIdsSet.length / limit),
            songs: songOther,
        };
    } catch (error) {
        throw error;
    }
};

const getSongSameGenreService = async ({ artistId, page = 1, limit = 10, user } = {}) => {
    try {
        const start = (page - 1) * limit;
        const end = start + limit;

        const genreIds = await artistSongService.fetchArtistGenreIds({ artistId: artistId });
        const artistIds = await artistSongService.fetchArtistSameGenre({ artistId: artistId, genreIds: genreIds });

        const allSongIds = await artistSongService.fetchSongIdsByArtist({
            conditions: { artistId: { [Op.in]: artistIds.map((a) => a.artistId) } },
        });

        const allSongIdsSet = Array.from(new Map(allSongIds.map((item) => [item.songId, item])).values());
        const songIds = allSongIdsSet.slice(start, end);

        const [songs, likedSongs] = await Promise.all([
            fetchSongs({ conditions: { id: { [Op.in]: songIds.map((s) => s.songId) }, privacy: false } }),
            user &&
                db.Like.findAll({
                    where: { songId: { [Op.in]: songIds.map((s) => s.songId) }, userId: user.id },
                }),
        ]);

        const songsMap = songs.reduce((map, record) => {
            map[record.id] = record;
            return map;
        }, {});

        const likedSongsMap = new Set(likedSongs?.map((like) => like.songId));

        const songOther = songIds.map((s) => {
            const song = songsMap[s.songId];
            const { totalPlay, totalLike, ...other } = song;
            const result = {
                ...other,
                viewCount: totalPlay,
                likeCount: totalLike,
            };
            if (user) {
                const liked = likedSongsMap.has(s.songId) ? true : false;
                result.liked = liked;
            }
            return result;
        });

        return {
            page: page,
            totalPage: Math.ceil(allSongIdsSet.length / limit),
            songs: songOther,
        };
    } catch (error) {
        throw error;
    }
};

const getCommentSongService = async ({ songId, page = 1, user } = {}) => {
    try {
        const limit = 10;
        const offset = (page - 1) * limit;

        const comments = await commentService.fetchAllComment({
            conditions: { [Op.and]: [{ songId: songId }, { commentParentId: null }] },
            limit: limit,
            offset: offset,
        });

        const [checkCommentChild, totalCommentOfSong, totalComment] = await Promise.all([
            commentService.fetchCountCommentChild({
                conditions: { commentParentId: { [Op.in]: comments.map((rec) => rec.id) } },
            }),
            commentService.fetchCommentCount({ conditions: { songId: songId } }),
            commentService.fetchCommentCount({ conditions: { songId: songId, commentParentId: { [Op.is]: null } } }),
        ]);

        const checkCommentChildMap = checkCommentChild.reduce((acc, record) => {
            acc[record.commentParentId] = record.totalComment;
            return acc;
        }, {});

        const checkHasChild = comments.map((rec) => ({
            ...rec,
            hasChild: checkCommentChildMap[rec.id] ?? 0,
            myComment: user && rec.userId === user.id,
        }));

        return {
            page: page,
            totalPage: calculateTotalPages(totalComment, limit),
            totalComment: totalCommentOfSong,
            comments: checkHasChild,
        };
    } catch (error) {
        throw error;
    }
};

const getCommentChildService = async ({ parentId, page = 1, user } = {}) => {
    try {
        const limit = 5;
        const offset = (page - 1) * limit;

        const [totalComment, comments] = await Promise.all([
            commentService.fetchCommentCount({ conditions: { commentParentId: parentId } }),
            commentService.fetchAllComment({
                conditions: { commentParentId: parentId },
                limit: limit,
                offset: offset,
            }),
        ]);

        const checkHasChild = comments.map((rec) => ({
            ...rec,
            myComment: user && rec.userId === user.id,
        }));

        return {
            page: page,
            totalPage: calculateTotalPages(totalComment, limit),
            comments: checkHasChild,
        };
    } catch (error) {
        throw error;
    }
};

// ------------------------------actions

const postPlaytimeService = async ({ user, data } = {}) => {
    await db.SongPlayHistory.create({
        historyId: uuidv4(),
        userId: user.id,
        songId: data.songId,
        playtime: data.playtime,
    });
};

const postLikedSongService = async ({ user, data } = {}) => {
    const transaction = await db.sequelize.transaction();
    try {
        const checkLiked = await db.Like.findOne({
            where: { userId: user.id, songId: data.songId },
        });

        if (checkLiked) {
            const playlist = await db.Playlist.findOne({ where: { userId: user.id }, attributes: ['id'], raw: true });
            await Promise.all([
                db.Like.destroy({ where: { likeId: checkLiked.likeId } }, { transaction }),
                db.PlaylistSong.destroy({ where: { playlistId: playlist.id, songId: data.songId } }, { transaction }),
            ]);
            await transaction.commit();
            return false;
        } else {
            const playlist = await db.Playlist.findOne({ where: { userId: user.id }, attributes: ['id'], raw: true });
            await Promise.all([
                db.Like.create(
                    {
                        userId: user.id,
                        songId: data.songId,
                    },
                    { transaction },
                ),
                db.PlaylistSong.create(
                    {
                        playlistId: playlist.id,
                        songId: data.songId,
                    },
                    { transaction },
                ),
            ]);
            await transaction.commit();
            return true;
        }
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

const serach2Service = async (query, page = 1, limit = 10) => {
    try {
        const start = (page - 1) * limit;
        const end = start + limit;

        const [artists, songs, albums] = await Promise.all([
            db.Artist.findAll({ order: [['createdAt', 'DESC']], where: { hide: false } }),
            db.Song.findAll({ order: [['releaseDate', 'DESC']], where: { privacy: false } }),
            db.Album.findAll({ order: [['releaseDate', 'DESC']] }),
        ]);

        const dataArtist = artists.map((a) => ({ id: a.id, name: a.name }));
        const dataSong = songs.map((s) => ({ id: s.id, title: s.title }));
        const dataAlbum = albums.map((a) => ({ albumId: a.albumId, title: a.title }));

        const options = {
            keys: ['name'],
            threshold: 0.8,
            includeScore: true,
        };
        const optionsSong = {
            keys: ['title'],
            threshold: 0.5,
            includeScore: true,
        };
        const optionsAlbum = {
            keys: ['title'],
            threshold: 0.5,
            includeScore: true,
        };

        // Fuse.js
        const fuseArtist = new Fuse(dataArtist, options);
        const fuseSong = new Fuse(dataSong, optionsSong);
        const fuseAlbum = new Fuse(dataAlbum, optionsAlbum);

        // Search
        const resultArtist = fuseArtist.search(query);
        const resultSong = fuseSong.search(query);
        const resultAlbum = fuseAlbum.search(query);

        const combinedResults = [
            ...resultArtist.map((result) => ({ ...result.item, score: result.score, type: 'artist' })),
            ...resultSong.map((result) => ({ ...result.item, score: result.score, type: 'song' })),
            ...resultAlbum.map((result) => ({ ...result.item, score: result.score, type: 'album' })),
        ].sort((a, b) => a.score - b.score);

        let songIds = [];
        if (combinedResults[0].type === 'artist') {
            songIds = await db.ArtistSong.findAll({
                where: { artistId: combinedResults[0].id, main: true },
                attributes: ['songId'],
            });
        }

        const [topResult, songTopResult, artistData, songData, albumData] = await Promise.all([
            combinedResults[0].type === 'artist' ? db.Artist.findByPk(combinedResults[0].id) : [],
            combinedResults[0].type === 'artist'
                ? fetchSongs({
                      conditions: { id: { [Op.in]: songIds?.map((s) => s.songId) }, privacy: false },
                      limit: 5,
                  })
                : [],
            db.Artist.findAll({
                where: { id: { [Op.in]: resultArtist.map((r) => r.item.id).slice(start, end) } },
                attributes: ['id', 'name', 'avatar', 'bio'],
            }),
            fetchSongs({
                conditions: { id: { [Op.in]: resultSong.map((r) => r.item.id).slice(start, end) }, privacy: false },
            }),
            db.Album.findAll({
                where: { albumId: { [Op.in]: resultAlbum.map((a) => a.item.albumId).slice(start, end) } },
                attributes: ['albumId', 'title', 'releaseDate'],
                include: [{ model: db.AlbumImage, as: 'albumImages', attributes: ['image', 'size'] }],
            }),
        ]);

        const albumDataDetail = await Promise.all(
            albumData.map(async (album) => {
                const songId = await db.AlbumSong.findOne({ where: { albumId: album.albumId } });
                const songOfAlbum =
                    songId &&
                    (await db.Song.findOne({
                        // where: { albumId: album.albumId },
                        where: { id: songId.songId, privacy: false },
                        attributes: [],
                        include: [
                            {
                                model: db.Artist,
                                as: 'artists',
                                attributes: ['id', 'name', 'avatar', 'bio'],
                                through: {
                                    attributes: ['main'],
                                },
                            },
                        ],
                        limit: 1,
                    }));
                return {
                    ...album.toJSON(),
                    artists: songOfAlbum ? songOfAlbum.toJSON().artists : null,
                };
            }),
        );

        return {
            errCode: 200,
            topResult: topResult,
            songTopResult: songTopResult,
            artistData: resultArtist
                .map((r) => artistData.find((artist) => artist.id === r.item.id))
                .filter((artist) => artist),
            songData: resultSong.map((r) => songData.find((song) => song.id === r.item.id)).filter((song) => song),
            albumData: resultAlbum
                .map((r) => albumDataDetail.find((album) => album.albumId === r.item.albumId))
                .filter((album) => album),
        };
    } catch (error) {
        throw error;
    }
};

const searchSongService = async (query, page = 1, limit = 10) => {
    try {
        const start = (page - 1) * limit;
        const end = start + limit;

        const allSongs = await db.Song.findAll({ where: { privacy: false } });
        const dataSong = allSongs.map((s) => ({ id: s.id, title: s.title }));
        const optionsSong = {
            keys: ['title'],
            threshold: 0.8,
            includeScore: true,
        };
        const fuseSong = new Fuse(dataSong, optionsSong);
        const resultSong = fuseSong.search(query);
        const sortedResults = resultSong.sort((a, b) => a.score - b.score);
        const resultSongTop = sortedResults.slice(start, end);

        const songs = await fetchSongs({
            conditions: { id: { [Op.in]: resultSongTop.map((r) => r.item.id) }, privacy: false },
        });
        const songsMap = songs.reduce((acc, item) => {
            acc[item.id] = item;
            return acc;
        }, {});
        const result = resultSongTop.map((r) => {
            return songsMap[r.item.id];
        });
        return result;
    } catch (error) {
        throw error;
    }
};

export const songService = {
    fetchSongs,
    fetchSongPlayCount,
    fetchSongLikeCount,
    checkCommentExists,
    checkSongExists,
    getAllSongService,
    getSongService,
    getWeeklyTopSongsService,
    getTrendingSongsService,
    getNewReleaseSongsService,
    // ---------------------
    getOtherSongByArtistService,
    getSongOtherArtistService,
    getSongSameGenreService,
    // ---------------------
    getCommentSongService,
    getCommentChildService,
    // ----------actions
    postPlaytimeService,
    postLikedSongService,
    // ---------------
    serach2Service,
    searchSongService,
};
