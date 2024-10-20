const db = require('../models');
const Song = db.Song;
const SongPlayHistory = db.SongPlayHistory;
const Like = db.Like;
const Sequelize = db.Sequelize;
const sequelize = db.sequelize;
// const Op = db.Op;
const { Op } = require('sequelize');

const getAllSongService = async () => {
    try {
        const songs = await Song.findAll();
        return {
            errCode: 0,
            errMess: 'Get all songs',
            songs: songs,
        };
    } catch (error) {
        return {
            errCode: 8,
            errMess: `Internal Server Error ${error.message}`,
        };
    }
};

const getSongService = async (songId) => {
    try {
        const song = await Song.findOne({ where: { id: songId } });
        return {
            errCode: 0,
            errMess: 'Get song by ID',
            songs: song,
        };
    } catch (error) {
        return {
            errCode: 8,
            errMess: `Internal Server Error ${error.message}`,
        };
    }
};

const deleteSongService = async (songId) => {
    try {
        await Song.destroy({ where: { id: songId } });
        return {
            errCode: 0,
            errMess: 'Delete song success',
        };
    } catch (error) {
        return {
            errCode: 8,
            errMess: `Internal Server Error ${error.message}`,
        };
    }
};

const updateSongService = async (data) => {
    try {
        console.log(data);
        updateData = data.updateData;
        songId = data.songId;

        if (Object.keys(updateData).length === 0) {
            return {
                errCode: 3,
                errMess: 'Missing data',
            };
        } else {
            const song = await Song.findOne({ where: { id: songId } });
            if (song) {
                const update = await Song.update(updateData, { where: { id: songId } });
                return {
                    errCode: update ? 0 : 3,
                    errMess: update ? 'Song updated successfully' : 'Bad Request',
                };
            } else {
                return {
                    errCode: 6,
                    errMess: 'Song not found',
                };
            }
        }
    } catch (error) {
        return {
            errCode: 8,
            errMess: 'Error server',
        };
    }
};

const createSongService = async (data) => {
    try {
        const song = await Song.findOne({ where: { id: data.songId } });
        if (song) {
            return {
                errCode: 7,
                errMess: 'Song exits',
            };
        } else {
            await Song.create(data);
            return {
                errCode: 0,
                errMess: 'Song created successfully',
            };
        }
    } catch (error) {
        return {
            errCode: 8,
            errMess: `Song creation failed: ${error.message}`,
        };
    }
};

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
            errMess: 'Successfully',
            newReleaseSongs: newReleaseSongs,
        };
    } catch (error) {
        return {
            errCode: 8,
            errMess: `User creation failed: ${error.message}`,
        };
    }
};



module.exports = {
    getAllSongService,
    getSongService,
    deleteSongService,
    updateSongService,
    createSongService,
    getWeeklyTopSongsService,
    getTrendingSongsService,
    // getTopSongsService,
    getNewReleaseSongsService,
};
