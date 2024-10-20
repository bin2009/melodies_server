const db = require('../models');
const Song = db.Song;
const SongPlayHistory = db.SongPlayHistory;
const Like = db.Like;
const Artist = db.Artist;
const Sequelize = db.Sequelize;
const sequelize = db.sequelize;
// const Op = db.Op;
const { Op, where } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

// ---------------------------SONG------------------

const getAllSongService = async () => {
    try {
        const songs = await Song.findAll();
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
        const song = await Song.findOne({ where: { id: songId } });
        if (song) {
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

const getWeeklyTopSongsService = async () => {
    try {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const topSongs = await SongPlayHistory.findAll({
            where: {
                playtime: {
                    [Op.gt]: 30,
                },
                createdAt: {
                    [Op.gte]: oneWeekAgo,
                },
            },
            attributes: ['songId', [Sequelize.fn('COUNT', Sequelize.col('songId')), 'playCount']],
            include: [
                {
                    model: Song,
                    as: 'songPlay',
                    attributes: { exclude: [] },
                },
            ],
            group: ['songId', 'songPlay.id'],
            order: [[Sequelize.fn('COUNT', Sequelize.col('songId')), 'DESC']],
            limit: 10,
        });

        return {
            errCode: 0,
            errMess: 'Successfully',
            weeklyTopSongs: topSongs,
        };
    } catch (error) {
        return {
            errCode: 8,
            errMess: `User creation failed: ${error.message}`,
        };
    }
};

const getTrendingSongsService = async () => {
    try {
        const query = `
            SELECT 
                s.*,
                COUNT(DISTINCT sph."historyId") AS play_count,
                COUNT(DISTINCT l."likeId") AS like_count,
                COUNT(DISTINCT sph."historyId") + COUNT(DISTINCT l."likeId") AS total_count
            FROM "Song" s
            LEFT JOIN "SongPlayHistory" sph ON sph."songId" = s.id
            LEFT JOIN "Like" l ON l."songId" = s.id
            GROUP BY s.id
            ORDER BY total_count DESC
            LIMIT 10;
        `;
        const [topSongs] = await sequelize.query(query);
        return {
            errCode: 0,
            errMess: 'Successfully',
            topSongs: topSongs,
        };
    } catch (error) {
        return {
            errCode: 8,
            errMess: `User creation failed: ${error.message}`,
        };
    }
};

// const getTopSongsService = async () => {
//     try {
//         const topSongs = await db.Song.findAll({
//             attributes: {
//                 include: [
//                     [
//                         db.sequelize.fn(
//                             'COUNT',
//                             db.sequelize.fn('DISTINCT', db.sequelize.col('SongPlayHistory.historyId')),
//                         ),
//                         'play_count',
//                     ],
//                     [
//                         db.sequelize.fn('COUNT', db.sequelize.fn('DISTINCT', db.sequelize.col('Like.likeId'))),
//                         'like_count',
//                     ],
//                     [
//                         db.sequelize.fn(
//                             'COUNT',
//                             db.sequelize.fn('DISTINCT', db.sequelize.col('SongPlayHistory.historyId')),
//                         ) + db.sequelize.fn('COUNT', db.sequelize.fn('DISTINCT', db.sequelize.col('Like.likeId'))),
//                         'total_count',
//                     ],
//                 ],
//             },
//             include: [
//                 { model: db.SongPlayHistory, as: 'playHistories', required: false },
//                 { model: db.Like, as: 'likes', required: false },
//             ],
//             group: ['Song.id'],
//             order: [[db.sequelize.col('total_count'), 'DESC']],
//             limit: 10,
//         });

//         return {
//             errCode: 0,
//             errMess: 'Top songs retrieved successfully',
//             songs: topSongs,
//         };
//     } catch (error) {
//         return {
//             errCode: 8,
//             errMess: `Internal Server Error ${error.message}`,
//         };
//     }
// };

const getNewReleaseSongsService = async () => {
    try {
        const query = `
            select s.*
            from "Song" s
            order by "createdAt" desc 
        `;
        const [newReleaseSongs] = await sequelize.query(query);
        return {
            errCode: 0,
            errMess: 'Get release song successfully',
            newReleaseSongs: newReleaseSongs,
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
        const popArtist = await Artist.findAll({
            attributes: {
                include: [
                    // Đếm số lượng người theo dõi thông qua bảng Follow
                    [Sequelize.fn('COUNT', Sequelize.col('users.id')), 'followerCount'],
                ],
            },
            include: [
                {
                    model: db.User,
                    as: 'users',
                    attributes: [],
                    through: {
                        attributes: [],
                    },
                },
            ],
            group: ['Artist.id'],
            order: [[Sequelize.fn('COUNT', Sequelize.col('users.id')), 'DESC']],
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
        const artists = await Artist.findAll();
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
        const artist = await Artist.findOne({ where: { id: artistId } });
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
};
