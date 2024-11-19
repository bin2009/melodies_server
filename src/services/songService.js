import db from '~/models';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { artistSongService } from './artistSongService';
import { commentService } from './commentService';
import { timeFormatter } from '~/validations/timeFormatter';
const Fuse = require('fuse.js');

const fetchSongs = async ({
    limit = undefined,
    offset = undefined,
    conditions = {},
    order = [['createdAt', 'DESC']],
    additionalAttributes = [],
    group = [],
    mode = 'findAll', // or findOne
} = {}) => {
    const songs = await db.Song[mode]({
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
                attributes: ['albumId', 'title', 'albumType'],
                through: { attributes: [] },
                include: [{ model: db.AlbumImage, as: 'albumImages', attributes: ['image', 'size'] }],
            },
            {
                model: db.Artist,
                as: 'artists',
                attributes: ['id', 'name'],
                through: { attributes: ['main'] },
                include: [
                    { model: db.Genre, as: 'genres', attributes: ['genreId', 'name'], through: { attributes: [] } },
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
    });

    return songs;
};

const checkSongExists = async (songId) => {
    return await db.Song.findByPk(songId);
};

const fetchSongPlayCount = async ({ limit = undefined, offset = undefined, conditions = {}, order = 'DESC' } = {}) => {
    const songWithPlayCount = await db.SongPlayHistory.findAll({
        attributes: ['songId', [db.Sequelize.fn('COUNT', db.Sequelize.col('historyId')), 'playCount']],
        where: conditions,
        group: ['songId'],
        order: [[db.Sequelize.fn('COUNT', db.Sequelize.col('historyId')), order]],
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
        const start = (page - 1) * limit;
        const end = start + limit;

        const [totalSong, songs] = await Promise.all([fetchSongCount(), fetchSongs()]);

        const [totalPlay, totalComment, totalLike] = await Promise.all([
            db.SongPlayHistory.findAll({
                where: { songId: { [db.Sequelize.Op.in]: songs.map((song) => song.id) } },
                attributes: ['songId', [db.Sequelize.fn('COUNT', db.Sequelize.col('historyId')), 'totalPlay']],
                group: ['songId'],
                raw: true,
            }),
            db.Comment.findAll({
                where: { songId: { [db.Sequelize.Op.in]: songs.map((song) => song.id) } },
                attributes: ['songId', [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'totalComment']],
                group: ['songId'],
                raw: true,
            }),
            db.Like.findAll({
                where: { songId: { [db.Sequelize.Op.in]: songs.map((song) => song.id) } },
                attributes: ['songId', [db.Sequelize.fn('COUNT', db.Sequelize.col('likeId')), 'totalLike']],
                group: ['songId'],
                raw: true,
            }),
        ]);

        // Tạo một map cho kết quả dễ truy xuất
        const playCountsMap = totalPlay.reduce((acc, curr) => {
            acc[curr.songId] = curr.totalPlay;
            return acc;
        }, {});

        const commentCountsMap = totalComment.reduce((acc, curr) => {
            acc[curr.songId] = curr.totalComment;
            return acc;
        }, {});

        const likeCountsMap = totalLike.reduce((acc, curr) => {
            acc[curr.songId] = curr.totalLike;
            return acc;
        }, {});

        const result = songs.map((s) => {
            const { id, album, artists, releaseDate, createdAt, ...other } = s.toJSON();

            return {
                id,
                ...other,
                releaseDate: timeFormatter.formatDateToVietnamTime(releaseDate),
                createdAt: timeFormatter.formatDateToVietnamTime(createdAt),
                album: album ?? null,
                artists: artists.map(({ ArtistSong, ...otherArtist }) => ({
                    ...otherArtist,
                    main: ArtistSong?.main ?? false,
                })),
                totalDownload: 0,
                totalPlay: playCountsMap[id] ?? 0,
                totalComment: commentCountsMap[id] ?? 0,
                totalLike: likeCountsMap[id] ?? 0,
            };
        });

        // result.sort((a, b) => {
        //     if (order === 'high') {
        //         if (sortMapDate.includes(sortField)) {
        //             return new Date(b[sortField]) - new Date(a[sortField]);
        //         } else if (sortMapString.includes(sortField)) {
        //             return a[sortField].localeCompare(b[sortField]);
        //         } else if (sortMapNumber.includes(sortField)) {
        //             return b[sortField] - a[sortField];
        //         }
        //     } else if (order === 'low') {
        //         if (sortMapDate.includes(sortField)) {
        //             return new Date(a[sortField]) - new Date(b[sortField]);
        //         } else if (sortMapString.includes(sortField)) {
        //             return b[sortField].localeCompare(a[sortField]);
        //         } else if (sortMapNumber.includes(sortField)) {
        //             return a[sortField] - b[sortField];
        //         }
        //     }
        //     return 0;
        // });

        return {
            page: page,
            totalPage: Math.ceil(totalSong / limit),
            song: result.slice(start, end),
        };
    } catch (error) {
        throw error;
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
                    attributes: ['albumId', 'title', 'albumType'],
                    through: { attributes: [] },
                    include: [{ model: db.AlbumImage, as: 'albumImages', attributes: ['image', 'size'] }],
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

const getWeeklyTopSongsService = async ({ page = 1, user } = {}) => {
    try {
        const limit = 10;
        const offset = (page - 1) * limit;

        const [totalSong, topSongIds] = await Promise.all([
            fetchSongPlayCount({
                conditions: {
                    createdAt: {
                        [Op.gt]: db.Sequelize.literal("CURRENT_TIMESTAMP - INTERVAL '21 DAY'"),
                    },
                },
            }),
            fetchSongPlayCount({
                conditions: {
                    createdAt: {
                        [Op.gt]: db.Sequelize.literal("CURRENT_TIMESTAMP - INTERVAL '21 DAY'"),
                    },
                },
                limit: limit,
                offset: offset,
            }),
        ]);

        const [songs, likedSongs] = await Promise.all([
            fetchSongs({
                conditions: {
                    id: {
                        [Op.in]: topSongIds.map((rec) => rec.songId),
                    },
                },
            }),
            user &&
                fetchUserLikedSong({
                    conditions: {
                        [Op.and]: [{ songId: { [Op.in]: topSongIds?.map((rec) => rec.songId) } }, { userId: user.id }],
                    },
                }),
        ]);

        const topSongIdsMap = topSongIds.reduce((map, record) => {
            map[record.songId] = record.playCount;
            return map;
        }, {});

        const songsMap = songs.reduce((map, record) => {
            map[record.id] = record.toJSON();
            return map;
        }, {});

        const likedSongsMap = new Set(likedSongs?.map((like) => like.songId));

        const weeklyTopSongs = topSongIds.map((song) => ({
            ...songsMap[song.songId],
            playCount: topSongIdsMap[song.songId] ?? 0,
            liked: user && likedSongsMap.has(song.songId),
        }));

        return {
            page: page,
            totalPage: calculateTotalPages(totalSong.length, limit),
            weeklyTopSongs: weeklyTopSongs,
        };
    } catch (error) {
        throw error;
    }
};

const getTrendingSongsService = async ({ page = 1, user } = {}) => {
    try {
        const limit = 10;
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
                },
            }),
            user &&
                fetchUserLikedSong({
                    conditions: {
                        [Op.and]: [
                            { songId: { [Op.in]: sortedSongStats?.map((rec) => rec.songId) } },
                            { userId: user.id },
                        ],
                    },
                }),
        ]);

        const songsMap = songs.reduce((map, record) => {
            map[record.id] = record.toJSON();
            return map;
        }, {});

        const likedSongsMap = new Set(likedSongs?.map((like) => like.songId));

        const trendingSongs = sortedSongStats.map((song) => ({
            ...songsMap[song.songId],
            playCount: song.playCount ?? 0,
            likeCount: song.likeCount ?? 0,
            totalCount: song.total ?? 0,
            liked: user && likedSongsMap.has(song.songId),
        }));

        return {
            page: page,
            totalPage: calculateTotalPages(Object.keys(songStats).length, limit),
            trendingSongs: trendingSongs,
        };
    } catch (error) {
        throw error;
    }
};

const getNewReleaseSongsService = async ({ page = 1, user } = {}) => {
    try {
        const limit = 10;
        const offset = (page - 1) * limit;

        const newReleaseSongs = await fetchSongs({ limit: limit, offset: offset, order: [['releaseDate', 'DESC']] });

        const [playCountSong, likeCountSong, likedSongs, totalSong] = await Promise.all([
            fetchSongPlayCount({
                conditions: {
                    songId: {
                        [Op.in]: newReleaseSongs.map((record) => record.id),
                    },
                },
            }),
            fetchSongLikeCount({
                conditions: {
                    songId: {
                        [Op.in]: newReleaseSongs.map((record) => record.id),
                    },
                },
            }),
            user &&
                fetchUserLikedSong({
                    conditions: {
                        [Op.and]: [
                            { songId: { [Op.in]: newReleaseSongs?.map((rec) => rec.songId) } },
                            { userId: user.id },
                        ],
                    },
                }),
            fetchSongCount(),
        ]);

        const likedSongsMap = new Set(likedSongs?.map((like) => like.songId));
        const playCountSongMap = playCountSong.reduce((arr, record) => {
            arr[record.songId] = record.playCount;
            return arr;
        }, {});
        const likeCountSongMap = likeCountSong.reduce((arr, record) => {
            arr[record.songId] = record.likeCount;
            return arr;
        }, {});

        const newRaleaseSongMap = newReleaseSongs.map((song) => ({
            ...song.toJSON(),
            playCount: playCountSongMap[song.id] ?? 0,
            likeCount: likeCountSongMap[song.id] ?? 0,
            liked: user && likedSongsMap.has(song.songId),
        }));
        return {
            page: page,
            totalPage: calculateTotalPages(totalSong, limit),
            newReleaseSongs: newRaleaseSongMap,
        };
    } catch (error) {
        throw error;
    }
};

const getOtherSongByArtistService = async ({ artistId, page = 1, user } = {}) => {
    try {
        const limit = 10;
        const offset = (page - 1) * limit;

        const songIds = await artistSongService.fetchSongIdsByArtist({
            limit: limit,
            offset: offset,
            conditions: { artistId: artistId, main: true },
        });

        const [totalSong, songInfo, viewCount, likeCount, likedSongs] = await Promise.all([
            artistSongService.fetchSongCountByArtist({ conditions: { artistId: artistId } }),
            fetchSongs({
                conditions: {
                    id: {
                        [Op.in]: songIds.map((s) => s.songId),
                    },
                },
            }),
            fetchSongPlayCount({
                conditions: {
                    songId: {
                        [Op.in]: songIds.map((s) => s.songId),
                    },
                },
            }),
            fetchSongLikeCount({
                conditions: {
                    songId: {
                        [Op.in]: songIds.map((s) => s.songId),
                    },
                },
            }),
            user &&
                fetchUserLikedSong({
                    conditions: {
                        [Op.and]: [{ songId: { [Op.in]: songIds?.map((rec) => rec.songId) } }, { userId: user.id }],
                    },
                }),
        ]);

        const viewCountMap = viewCount.reduce((map, item) => {
            map[item.songId] = item.viewCount;
            return map;
        }, {});

        const likeCountMap = likeCount.reduce((map, item) => {
            map[item.songId] = item.likeCount;
            return map;
        }, {});

        const songInfoMap = songInfo.reduce((map, item) => {
            map[item.id] = item.toJSON();
            return map;
        }, {});

        const likedSongIds = likedSongs?.map((ls) => ls.songId);

        const songOther = songIds.map((s) => ({
            ...(songInfoMap[s.songId] ?? null),
            viewCount: viewCountMap[s.songId] ?? 0,
            likeCount: likeCountMap[s.songId] ?? 0,
            liked: user && likedSongIds.includes(s.songId),
        }));

        return {
            page: page,
            totalPage: calculateTotalPages(totalSong, limit),
            songs: songOther,
        };
    } catch (error) {
        throw error;
    }
};

const getSongOtherArtistService = async ({ artistId, page = 1, user } = {}) => {
    try {
        const limit = 10;
        const offset = (page - 1) * limit;

        const songIds = await artistSongService.fetchSongIdsByArtist({
            conditions: { artistId: artistId, main: false },
            limit: limit,
            offset: offset,
        });

        const [totalSong, songInfo, viewCount, likeCount, likedSongs] = await Promise.all([
            artistSongService.fetchSongCountByArtist({ conditions: { artistId: artistId, main: false } }),
            fetchSongs({
                conditions: {
                    id: {
                        [Op.in]: songIds.map((s) => s.songId),
                    },
                },
            }),
            fetchSongPlayCount({
                conditions: {
                    songId: {
                        [Op.in]: songIds.map((s) => s.songId),
                    },
                },
            }),
            fetchSongLikeCount({
                conditions: {
                    songId: {
                        [Op.in]: songIds.map((s) => s.songId),
                    },
                },
            }),
            user &&
                fetchUserLikedSong({
                    conditions: {
                        [Op.and]: [{ songId: { [Op.in]: songIds?.map((rec) => rec.songId) } }, { userId: user.id }],
                    },
                }),
        ]);

        const viewCountMap = viewCount.reduce((map, item) => {
            map[item.songId] = item.viewCount;
            return map;
        }, {});

        const likeCountMap = likeCount.reduce((map, item) => {
            map[item.songId] = item.likeCount;
            return map;
        }, {});

        const songInfoMap = songInfo.reduce((map, item) => {
            map[item.id] = item.toJSON();
            return map;
        }, {});

        const likedSongIds = likedSongs?.map((ls) => ls.songId);

        const songOther = songIds.map((s) => ({
            ...(songInfoMap[s.songId] ?? null),
            viewCount: viewCountMap[s.songId] ?? 0,
            likeCount: likeCountMap[s.songId] ?? 0,
            liked: user && likedSongIds.includes(s.songId),
        }));

        return {
            page: page,
            totalPage: calculateTotalPages(totalSong, limit),
            songs: songOther,
        };
    } catch (error) {
        throw error;
    }
};

const getSongSameGenreService = async ({ artistId, page = 1, user } = {}) => {
    try {
        const limit = 10;
        const offset = (page - 1) * limit;

        const genreIds = await artistSongService.fetchArtistGenreIds({ artistId: artistId });

        const artistIds = await artistSongService.fetchArtistSameGenre({ artistId: artistId, genreIds: genreIds });

        const [totalSong, songIds] = await Promise.all([
            artistSongService.fetchSongCountByArtist({
                conditions: { artistId: { [Op.in]: artistIds.map((a) => a.artistId) } },
            }),
            artistSongService.fetchSongIdsByArtist({
                conditions: { artistId: { [Op.in]: artistIds.map((a) => a.artistId) } },
                limit: limit,
                offset: offset,
            }),
        ]);

        const songs = await fetchSongs({ conditions: { id: { [Op.in]: songIds.map((s) => s.songId) } } });

        const [viewCount, likeCount, likedSongs] = await Promise.all([
            fetchSongPlayCount({ conditions: { songId: { [Op.in]: songs.map((s) => s.id) } } }),
            fetchSongLikeCount({ conditions: { songId: { [Op.in]: songs.map((s) => s.id) } } }),
            user &&
                fetchUserLikedSong({
                    conditions: { [Op.and]: [{ songId: { [Op.in]: songs.map((s) => s.id) } }, { userId: user.id }] },
                }),
        ]);

        const viewCountMap = viewCount.reduce((map, item) => {
            map[item.songId] = item.viewCount;
            return map;
        }, {});

        const likeCountMap = likeCount.reduce((map, item) => {
            map[item.songId] = item.likeCount;
            return map;
        }, {});

        const songInfoMap = songs.reduce((map, item) => {
            map[item.id] = item.toJSON();
            return map;
        }, {});

        const likedSongIds = likedSongs?.map((ls) => ls.songId);

        const songOther = songIds.map((s) => ({
            ...(songInfoMap[s.songId] ?? null),
            viewCount: viewCountMap[s.songId] ?? 0,
            likeCount: likeCountMap[s.songId] ?? 0,
            liked: user && likedSongIds.includes(s.songId),
        }));

        return {
            page: page,
            totalPage: calculateTotalPages(totalSong, limit),
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
            ...rec.toJSON(),
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
        const limit = 10;
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
            ...rec.toJSON(),
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
    const checkLiked = await db.Like.findOne({
        where: { userId: user.id, songId: data.songId },
    });

    if (checkLiked) {
        await db.Like.destroy({ where: { likeId: checkLiked.likeId } });
        return false;
    } else {
        await db.Like.create({
            likeId: uuidv4(),
            userId: user.id,
            songId: data.songId,
        });
        return true;
    }
};

const serach2Service = async (query) => {
    const start = 0;
    const end = start + 10;

    const [artists, songs, albums] = await Promise.all([
        db.Artist.findAll({ order: [['createdAt', 'DESC']] }),
        db.Song.findAll({ order: [['releaseDate', 'DESC']] }),
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

    const [topResult, songTopResult, artistData, songData, albumData] = await Promise.all([
        combinedResults[0].type === 'artist' ? db.Artist.findByPk(combinedResults[0].id) : [],
        combinedResults[0].type === 'artist'
            ? db.Song.findAll({
                  attributes: ['id', 'title', 'releaseDate', 'duration', 'lyric', 'filePathAudio', 'createdAt'],
                  include: [
                      {
                          model: db.ArtistSong,
                          as: 'artistSong',
                          where: { artistId: combinedResults[0].id, main: true },
                          attributes: [],
                      },
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
                  order: [['createdAt', 'DESC']],
                  limit: 5,
              })
            : [],
        db.Artist.findAll({
            where: { id: { [Op.in]: resultArtist.map((r) => r.item.id).slice(start, end) } },
            attributes: ['id', 'name', 'avatar', 'bio'],
        }),
        db.Song.findAll({
            where: { id: { [Op.in]: resultSong.map((r) => r.item.id).slice(start, end) } },
            attributes: ['id', 'title', 'duration', 'lyric', 'filePathAudio', 'releaseDate'],
            include: [
                {
                    model: db.Artist,
                    as: 'artists',
                    attributes: ['id', 'name'],
                    through: {
                        attributes: ['main'],
                    },
                },
                {
                    model: db.Album,
                    as: 'album',
                    attributes: ['albumId', 'title', 'releaseDate', 'albumType'],
                    include: [{ model: db.AlbumImage, as: 'albumImages', attributes: ['image', 'size'] }],
                },
            ],
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
                    where: { id: songId.songId },
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
};
