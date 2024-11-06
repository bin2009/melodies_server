const db = require('../models');
const User = db.User;
const bcrypt = require('bcryptjs');
const saltRounds = 10;
const { Op } = require('sequelize');

const createService = async (data) => {
    try {
        const hashPass = await bcrypt.hash(data.password, saltRounds);
        data.password = hashPass;
        data.role = 'Admin';
        data.statusPassword = false;
        data.accountType = 'Premium';
        data.status = true;
        const newUser = await User.create(data);
        return {
            errCode: 0,
            errMess: 'Admin created successfully',
        };
    } catch (error) {
        return {
            errCode: 8,
            errMess: `Admin creation failed: ${error.message}`,
        };
    }
};

const getRecentUserService = async (page) => {
    try {
        const limit = 10;
        const skip = (page - 1) * limit;

        const totalUser = await db.User.count();
        const totalPage = Math.ceil(totalUser / limit);

        if (page < 1 || page > totalPage) {
            return {
                errCode: 400,
                message: 'Requested page number is out of range',
            };
        }

        const recentUser = await db.User.findAll({
            attributes: ['id', 'name', 'username', 'image', 'image', 'status'],
            order: [['createdAt', 'DESC']],
            limit: limit,
            offset: skip,
        });

        return {
            errCode: 200,
            message: 'Get recents users success',
            page: page,
            totalPage: totalPage,
            users: recentUser,
        };
    } catch (error) {
        return {
            errCode: 500,
            errMess: `Get recent users failed: ${error.message}`,
        };
    }
};

const getRecentCommentService = async (page) => {
    try {
        const limit = 10;
        const skip = (page - 1) * limit;

        const totalComment = await db.Comment.count();
        const totalPage = Math.ceil(totalComment / limit);

        if (page < 1 || page > totalPage) {
            return {
                errCode: 400,
                message: 'Requested page number is out of range',
            };
        }

        const comments = await db.Comment.findAll({
            attributes: ['id', 'content', 'createdAt', 'hide', 'userId'],
            order: [['createdAt', 'DESC']],
            limit: limit,
            offset: skip,
            raw: true,
        });

        const users = await db.User.findAll({
            where: { id: { [Op.in]: comments.map((comment) => comment.userId) } },
            raw: true,
        });

        const recentComment = comments.map((comment) => {
            const user = users.find((u) => u.id === comment.userId);
            return {
                ...comment,
                name: user.name,
                username: user.username,
                image: user.image,
            };
        });

        return {
            errCode: 200,
            message: 'Get recent comments success',
            page: page,
            totalPage: totalPage,
            comments: recentComment,
        };
    } catch (error) {
        return {
            errCode: 500,
            errMess: `Get recent comments failed: ${error.message}`,
        };
    }
};

const getTotalPlayAndCmtYearService = async () => {
    try {
        const array = [
            { month: 'Jan', startDate: new Date('2024-10-01'), endDate: new Date('2024-10-02') },
            { month: 'Feb', startDate: new Date('2024-10-02'), endDate: new Date('2024-10-03') },
            { month: 'Mar', startDate: new Date('2024-10-03'), endDate: new Date('2024-10-04') },
            { month: 'Apr', startDate: new Date('2024-10-04'), endDate: new Date('2024-10-05') },
            { month: 'May', startDate: new Date('2024-10-05'), endDate: new Date('2024-10-06') },
            { month: 'Jun', startDate: new Date('2024-10-06'), endDate: new Date('2024-10-07') },
            { month: 'Jul', startDate: new Date('2024-10-07'), endDate: new Date('2024-10-08') },
            { month: 'Aug', startDate: new Date('2024-10-08'), endDate: new Date('2024-10-09') },
            { month: 'Sep', startDate: new Date('2024-10-09'), endDate: new Date('2024-10-10') },
            { month: 'Oct', startDate: new Date('2024-10-10'), endDate: new Date('2024-10-11') },
            { month: 'Nov', startDate: new Date('2024-10-11'), endDate: new Date('2024-10-12') },
            { month: 'Dec', startDate: new Date('2024-11-01'), endDate: new Date('2024-11-05') },
        ];

        let results = [];

        for (let month of array) {
            const totalPlay = await db.SongPlayHistory.count({
                where: {
                    createdAt: {
                        [Op.and]: [{ [Op.gte]: month.startDate }, { [Op.lt]: month.endDate }],
                    },
                },
            });

            const totalComment = await db.Comment.count({
                where: {
                    createdAt: {
                        [Op.and]: [{ [Op.gte]: month.startDate }, { [Op.lt]: month.endDate }],
                    },
                },
            });

            results.push({
                month: month.month,
                totalPlays: totalPlay,
                totalComments: totalComment,
            });
        }

        return {
            errCode: 200,
            message: 'Get total plays and comments success',
            data: results,
        };
    } catch (error) {
        return {
            errCode: 500,
            errMess: `Get total plays and comments failed: ${error.message}`,
        };
    }
};

const getUserGrowthService = async () => {
    try {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;

        const currentUserCount = await db.User.count({
            where: {
                createdAt: {
                    [Op.gte]: new Date(currentDate.getFullYear(), currentMonth - 1, 1),
                    [Op.lt]: new Date(currentDate.getFullYear(), currentMonth, 1),
                },
            },
        });

        const prevUserCount = await db.User.count({
            where: {
                createdAt: {
                    [Op.gte]: new Date(currentDate.getFullYear(), prevMonth - 1, 1),
                    [Op.lt]: new Date(currentDate.getFullYear(), prevMonth, 1),
                },
            },
        });

        const growth = ((currentUserCount - prevUserCount) / prevUserCount) * 100;

        return {
            errCode: 200,
            message: 'Get user growth success',
            growth: growth,
            currentUserCount: currentUserCount,
            prevUserCount: prevUserCount,
        };
    } catch (error) {
        return {
            errCode: 500,
            errMess: `Get user growth failed: ${error.message}`,
        };
    }
};

const getTotalService = async () => {
    try {
        const data = {
            totalSongs: (await db.Song.count()) || null,
            totalArtists: (await db.Artist.count()) || null,
            totalAlbums: (await db.Album.count()) || null,
            totalPlaylist: (await db.Playlist.count()) || null,
            totalUsers: (await db.User.count()) || null,
        };

        return {
            errCode: 200,
            message: 'Get total success',
            data: data,
        };
    } catch (error) {
        return {
            errCode: 500,
            errMess: `Get total failed: ${error.message}`,
        };
    }
};

const getTodayBestSongService = async () => {
    try {
        const today = new Date();
        const topSong = await db.SongPlayHistory.findOne({
            where: {
                createdAt: {
                    [Op.gte]: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
                    [Op.lt]: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
                },
            },
            order: [[db.Sequelize.fn('COUNT', db.Sequelize.col('historyId')), 'DESC']],
            group: ['songId'],
            attributes: ['songId', [db.Sequelize.fn('COUNT', db.Sequelize.col('historyId')), 'playCount']],
            raw: true,
        });

        const song = await db.Song.findOne({
            where: { id: topSong.songId },
            include: [
                {
                    model: db.Album,
                    as: 'album',
                    attributes: ['albumId', 'title', 'releaseDate'],
                    include: [{ model: db.AlbumImage, as: 'albumImages', attributes: ['image', 'size'] }],
                },
                {
                    model: db.Artist,
                    as: 'artists',
                    attributes: ['id', 'name', 'avatar'],
                    through: { attributes: ['main'] },
                },
            ],
            attributes: ['id', 'title', 'releaseDate', 'duration', 'lyric', 'filePathAudio'],
        });

        return {
            errCode: 200,
            message: `Get Today's Best Song success`,
            song: {
                ...song.toJSON(),
                playCount: topSong.playCount,
            },
        };
    } catch (error) {
        return {
            errCode: 500,
            errMess: `Get Today's Best Song failed: ${error.message}`,
        };
    }
};

module.exports = {
    createService,
    // -----------
    getRecentUserService,
    getRecentCommentService,
    getTotalPlayAndCmtYearService,
    getUserGrowthService,
    getTotalService,
    getTodayBestSongService,
};
