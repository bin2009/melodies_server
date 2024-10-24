const { raw } = require('mysql2');
const db = require('../models');
const { Op, INTEGER, where } = require('sequelize');

const Song = db.Song;
const SongPlayHistory = db.SongPlayHistory;
const Like = db.Like;
const Artist = db.Artist;
const Sequelize = db.Sequelize;
const sequelize = db.sequelize;
const Genre = db.Genre;
// const Op = db.Op;
// const { Op, where } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

// ---------------------------SONG------------------
const getAllSongService = async () => {
    try {
        const limit = 10;
        const songs = await db.Song.findAll({
            attributes: {
                include: [
                    'id',
                    [
                        db.sequelize.fn('COUNT', db.sequelize.fn('DISTINCT', db.sequelize.col('likes.likeId'))),
                        'likeCount',
                    ],
                    [
                        db.sequelize.literal(
                            `COUNT(DISTINCT CASE WHEN "playHistory"."playtime" > 100 THEN "playHistory"."historyId" END)`,
                        ),
                        'viewCount',
                    ],
                ],
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
                    attributes: ['id', 'name', 'avatar'],
                    through: {
                        attributes: ['main'],
                    },
                },
                {
                    model: db.Like,
                    as: 'likes',
                    attributes: [],
                },
                {
                    model: db.SongPlayHistory,
                    as: 'playHistory',
                    attributes: [],
                },
            ],
            subQuery: false,
            group: [
                'Song.id',
                'album.albumId',
                'album->albumImages.albumId',
                'artists.id',
                'artists->ArtistSong.songId',
                'artists->ArtistSong.artistId',
                // 'artists->ArtistSong.main',
            ],
            // limit: 10,
            // offset: 2 * offset,
        });

        return {
            errCode: 0,
            errMess: 'Get all songs successfully',
            songs: songs,
        };
    } catch (error) {
        return {
            errCode: 8,
            errMess: `Get all songs failed ${error.message}`,
        };
    }
};

const getSongService = async (songId) => {
    try {
        const song = await db.Song.findAll({
            where: { id: songId },
            attributes: {
                include: [
                    'id',
                    [
                        db.sequelize.fn('COUNT', db.sequelize.fn('DISTINCT', db.sequelize.col('likesSong.likeId'))),
                        'likeCount',
                    ],
                    [
                        db.sequelize.literal(
                            `COUNT(DISTINCT CASE WHEN "songPlayHistories"."playtime" > 100 THEN "songPlayHistories"."historyId" END)`,
                        ),
                        'viewCount',
                    ],
                ],
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
                    attributes: ['id', 'name', 'avatar'],
                    through: {
                        attributes: ['main'],
                    },
                },
                {
                    model: db.Like,
                    as: 'likesSong',
                    attributes: [],
                },
                {
                    model: db.SongPlayHistory,
                    as: 'songPlayHistories',
                    attributes: [],
                },
            ],
            // limit: 10,
            subQuery: false,
            group: [
                'Song.id',
                'album.albumId',
                'album->albumImages.id',
                'artists.id',
                'artists->ArtistSong.songId',
                'artists->ArtistSong.artistId',
                // 'artists->ArtistSong.main',
            ],
        });

        // const song = await Song.findOne({ where:});
        if (song.length > 0) {
            return {
                errCode: 0,
                errMess: 'Get song by ID successfully',
                songs: song,
            };
        } else {
            return {
                errCode: 6,
                errMess: 'Song not found',
            };
        }
    } catch (error) {
        return {
            errCode: 8,
            errMess: `Get song failed ${error.message}`,
        };
    }
};

const deleteSongService = async (songId) => {
    try {
        const song = await Song.findOne({ where: { id: songId } });
        if (song) {
            await Song.destroy({ where: { id: song.id } });
            await db.ArtistSong.destroy({ where: { songId: song.id } });
            return {
                errCode: 0,
                errMess: 'Delete song success',
            };
        } else {
            return {
                errCode: 6,
                errMess: 'Song not found',
            };
        }
    } catch (error) {
        return {
            errCode: 8,
            errMess: `Delete song failed ${error.message}`,
        };
    }
};

const updateSongService = async (data) => {
    try {
        const song = await Song.findOne({ where: { id: data.songId } });
        if (song) {
            await Song.update(data.updateData, { where: { id: data.songId } });
            return {
                errCode: 0,
                errMess: 'Song updated successfully',
            };
        } else {
            return {
                errCode: 6,
                errMess: 'Song not found',
            };
        }
    } catch (error) {
        return {
            errCode: 8,
            errMess: `Update song failed ${error.message}`,
        };
    }
};

const createSongService = async (data) => {
    try {
        const song = await Song.findAll({
            where: { title: data.title },
            attributes: ['title'],
            include: [
                {
                    model: Artist,
                    as: 'artists',
                    where: { id: data.artists[0].id },
                    attributes: [],
                    through: {
                        attributes: [],
                    },
                },
            ],
        });

        if (song.length > 1) {
            return {
                errCode: 0,
                errMess: 'Song exit',
            };
        } else {
            const newSong = await Song.create({
                id: uuidv4(),
                title: data.title,
                duration: data.duration,
                lyric: data.lyric,
                filePathAudio: data.filePathAudio,
                privacy: data.privacy,
            });

            if (!data.artists || data.artists.length === 0) {
                return {
                    errCode: 2,
                    errMess: 'No artists provided',
                };
            }

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
                errCode: 0,
                errMess: 'Song created successfully',
                newSong: newSong,
            };
        }
    } catch (error) {
        return {
            errCode: 8,
            errMess: `Song creation failed: ${error.message}`,
        };
    }
};

// ---------------------------THEME MUSIC------------------

const getWeeklyTopSongsService = async (offset) => {
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

        const weeklyTopSongs = await db.Song.findAll({
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
            attributes: [
                'id',
                'title',
                'albumId',
                [db.Sequelize.fn('COUNT', db.Sequelize.col('playHistory.historyId')), 'playCount'],
            ],
            group: ['Song.id', 'album.albumId', 'album->albumImages.albumImageId', 'artists.id'],
            order: [[db.Sequelize.fn('COUNT', db.Sequelize.col('playHistory.historyId')), 'DESC']],
            subQuery: false,
        });

        return {
            errCode: 200,
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

const getTrendingSongsService = async (offset) => {
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
            attributes: ['id', 'title', 'albumId', 'releaseDate', 'duration'],
            // group: [
            //     'Song.id',
            //     'album.albumId',
            //     'album->albumImages.albumImageId',
            //     'artists.id',
            //     'artists->ArtistSong.artistSongId',
            // ],
            // subQuery: false,
        });

        const trendingSongsWithCounts = trendingSongs.map((song) => {
            const songData = topSongIds.find((s) => s.songId === song.id);
            return {
                ...song.toJSON(),
                likeCount: songData ? songData.likeCount : 0,
                playCount: songData ? songData.playCount : 0,
                // totalCount: songData ? songData.totalCount : 0,
            };
        });

        const sortedTrendingSongs = topSongIds.map((topSong) =>
            trendingSongsWithCounts.find((song) => song.id === topSong.songId),
        );

        return {
            errCode: 0,
            message: 'Get trending song successfully',
            trendingSongs: sortedTrendingSongs,
        };
    } catch (error) {
        return {
            errCode: 8,
            message: `Get trending song failed: ${error.message}`,
        };
    }
};

const getNewReleaseSongsService = async (offset) => {
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
            attributes: ['id', 'title', 'releaseDate', 'duration'],
            // subQuery: false,
            order: [['releaseDate', 'DESC']],
            group: [
                // 'Song.id',
                // 'album.albumId',
                // 'artists.id',
                // 'artists->ArtistSong.songId',
                // // 'artists->ArtistSong.artistId',
                // // 'album->albumImages.albumId',
                // 'album->albumImages.albumImageId',
                // 'artists->ArtistSong.artistSongId'
            ], // Chỉ nhóm theo Son
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

        const newReleaseSongs2 = newReleaseSongs.map((song) => {
            const songData = topPlaySongIds.find((s) => s.songId === song.id);
            const songData2 = topLikeSongIds.find((s) => s.songId === song.id);

            return {
                ...song.toJSON(),
                playCount: songData ? songData.playCount : 0,
                likeCount: songData2 ? songData2.likeCount : 0,
            };
        });

        return {
            errCode: 0,
            errMess: 'Get release song successfully',
            newReleaseSongs: newReleaseSongs2,
            // newReleaseSongs2: songIds,
            // newReleaseSongs3: topPlaySongIds,
        };
    } catch (error) {
        return {
            errCode: 8,
            errMess: `Get release song failed: ${error.message}`,
        };
    }
};

const getPopularArtistService = async () => {
    try {
        const limit = 10;
        const popArtist = await Artist.findAll({
            attributes: {
                include: [[Sequelize.literal(`COUNT(followers.id) + "Artist"."followersCount"`), 'folCount']],
            },
            include: [
                {
                    model: db.User,
                    as: 'followers',
                    attributes: [],
                    through: {
                        attributes: [],
                    },
                },
            ],
            subQuery: false,
            order: [[Sequelize.literal(`COUNT(followers.id) + "Artist"."followersCount"`), 'DESC']],
            group: ['Artist.id'],
            // limit: limit,
            // offset: limit * offset,
        });
        return {
            errCode: 0,
            errMess: 'Get popular artist successfully',
            popArtist: popArtist,
        };
    } catch (error) {
        return {
            errCode: 8,
            errMess: `Get popular artist failed: ${error.message}`,
        };
    }
};

// ---------------------------ARTIST------------------

const getAllArtistService = async () => {
    try {
        const artists = await Artist.findAll({
            attributes: {
                include: [[db.sequelize.fn('COUNT', db.sequelize.col('followers.id')), 'followCount']],
            },
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
            group: ['Artist.id', 'genres.genreId', 'followers.id'],
        });
        return {
            errCode: 0,
            errMess: 'Get all artists',
            artists: artists,
        };
    } catch (error) {
        return {
            errCode: 8,
            errMess: `Get all artists failed: ${error.message}`,
        };
    }
};

const getArtistService = async (artistId) => {
    try {
        const artist = await Artist.findAll({
            where: { id: artistId },
            attributes: {
                include: [[db.sequelize.fn('COUNT', db.sequelize.col('followers.id')), 'followCount']],
            },
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
            group: ['Artist.id', 'genres.genreId', 'followers.id'],
        });
        return {
            errCode: 0,
            errMess: 'Get artist successfully',
            artists: artist,
        };
    } catch (error) {
        return {
            errCode: 8,
            errMess: `Get artist failed: ${error.message}`,
        };
    }
};

const createArtistService = async (data) => {
    try {
        const artist = await db.Artist.findAll({
            where: { name: data.name },
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

        // const artist = await Artist.findOne({ where: { name: data.name } });
        if (artist.length > 1) {
            return {
                errCode: 7,
                errMess: 'Artist exits',
            };
        } else {
            if (!data.genres || data.genres.length === 0) {
                return {
                    errCode: 2,
                    errMess: 'No genre provided',
                };
            }

            // tạo mới artist
            const newArtist = await Artist.create({
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
                errCode: 0,
                errMess: 'Create artist successfully',
                newArtist: newArtist,
            };
        }
    } catch (error) {
        return {
            errCode: 8,
            errMess: `Create artist failed: ${error.message}`,
        };
    }
};

const deleteArtistService = async (artistId) => {
    try {
        const artist = await Artist.findOne({ where: { id: artistId } });
        if (artist) {
            await Artist.destroy({ where: { id: artistId } });
            return {
                errCode: 0,
                errMess: 'Delete artist successfully',
            };
        } else {
            return {
                errCode: 6,
                errMess: 'Artist not found',
            };
        }
    } catch (error) {
        return {
            errCode: 8,
            errMess: `Delete artist failed: ${error.message}`,
        };
    }
};

const updateArtistService = async (data) => {
    try {
        const artist = await Artist.findOne({ where: { id: data.id } });
        if (artist) {
            await Artist.update(data, { where: { id: data.id } });
            return {
                errCode: 0,
                errMess: 'Update artist successfully',
            };
        } else {
            return {
                errCode: 6,
                errMess: 'Artist not found',
            };
        }
    } catch (error) {
        return {
            errCode: 8,
            errMess: `Update artist failed: ${error.message}`,
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
    getWeeklyTopSongsService,
    getTrendingSongsService,
    // getTopSongsService,
    getNewReleaseSongsService,
    getPopularArtistService,
    // ----------------------
    getAllArtistService,
    getArtistService,
    createArtistService,
    deleteArtistService,
    updateArtistService,
    // ----------------
    createGenreService,
    // ----------------
    getAllAlbumService,
    getAlbumPopularService,
    // ----------------
};
