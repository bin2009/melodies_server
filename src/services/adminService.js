const db = require('../models');
const User = db.User;
const bcrypt = require('bcryptjs');
const saltRounds = 10;
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

const formatDateToVietnamTime = (date) => {
    const createdAtVN = new Date(date);
    const formattedDate = createdAtVN.toLocaleString('sv-SE', { timeZone: 'Asia/Bangkok' }).replace('T', ' ') + '+07';
    return formattedDate;
};

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

const getAllArtistNameService = async () => {
    try {
        const artists = await db.Artist.findAll({
            attributes: ['id', 'name'],
            order: [['createdAt', 'DESC']],
            raw: true,
        });
        return {
            errCode: 200,
            message: 'Get all artist name success',
            artists: artists,
        };
    } catch (error) {
        return {
            errCode: 500,
            errMess: `Get all artist name failed: ${error.message}`,
        };
    }
};

const getAllGenreNameService = async () => {
    try {
        const genres = await db.Genre.findAll({
            attributes: ['genreId', 'name'],
            order: [['createdAt', 'DESC']],
            raw: true,
        });
        return {
            errCode: 200,
            message: 'Get all artist name success',
            genres: genres,
        };
    } catch (error) {
        return {
            errCode: 500,
            errMess: `Get all artist name failed: ${error.message}`,
        };
    }
};

const createGenreService = async (data) => {
    try {
        const genreName = await db.Genre.findOne({ where: { name: data.name.trim() } });
        if (genreName) {
            return {
                errCode: 409,
                message: 'Genre exits',
            };
        }

        const genre = await db.Genre.create({ genreId: uuidv4(), name: data.name.trim() });
        return {
            errCode: 200,
            message: 'Create genre success',
            genre: genre,
        };
    } catch (error) {
        return {
            errCode: 500,
            errMess: `Create genre failed: ${error.message}`,
        };
    }
};

const createArtistGenreService = async (data) => {
    try {
        const genres = data.genres;

        genres.map(async (g) => {
            return await db.ArtistGenre.create({ artistGenreId: uuidv4(), artistId: data.artistId, genreId: g });
        });

        return {
            errCode: 200,
            message: 'Create artist genre success',
        };
    } catch (error) {
        return {
            errCode: 500,
            errMess: `Create genre failed: ${error.message}`,
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
            attributes: ['id', 'name', 'username', 'email', 'image', 'image', 'status', 'createdAt', 'accountType'],
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
        const limit = 8;
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
        // const array = [
        //     { month: 'Jan', startDate: new Date('2024-10-01'), endDate: new Date('2024-10-02') },
        //     { month: 'Feb', startDate: new Date('2024-10-02'), endDate: new Date('2024-10-03') },
        //     { month: 'Mar', startDate: new Date('2024-10-03'), endDate: new Date('2024-10-04') },
        //     { month: 'Apr', startDate: new Date('2024-10-04'), endDate: new Date('2024-10-05') },
        //     { month: 'May', startDate: new Date('2024-10-05'), endDate: new Date('2024-10-06') },
        //     { month: 'Jun', startDate: new Date('2024-10-06'), endDate: new Date('2024-10-07') },
        //     { month: 'Jul', startDate: new Date('2024-10-07'), endDate: new Date('2024-10-08') },
        //     { month: 'Aug', startDate: new Date('2024-10-08'), endDate: new Date('2024-10-09') },
        //     { month: 'Sep', startDate: new Date('2024-10-09'), endDate: new Date('2024-10-10') },
        //     { month: 'Oct', startDate: new Date('2024-10-10'), endDate: new Date('2024-10-11') },
        //     { month: 'Nov', startDate: new Date('2024-10-11'), endDate: new Date('2024-10-12') },
        //     { month: 'Dec', startDate: new Date('2024-11-01'), endDate: new Date('2024-11-05') },
        // ];

        // let results = [];

        // for (let month of array) {
        //     const totalPlay = await db.SongPlayHistory.count({
        //         where: {
        //             createdAt: {
        //                 [Op.and]: [{ [Op.gte]: month.startDate }, { [Op.lt]: month.endDate }],
        //             },
        //         },
        //     });

        //     const totalComment = await db.Comment.count({
        //         where: {
        //             createdAt: {
        //                 [Op.and]: [{ [Op.gte]: month.startDate }, { [Op.lt]: month.endDate }],
        //             },
        //         },
        //     });

        //     results.push({
        //         month: month.month,
        //         totalPlays: totalPlay,
        //         totalComments: totalComment,
        //     });
        // }

        const plays = await db.SongPlayHistory.findAll({
            attributes: ['createdAt'],
        });

        const comments = await db.Comment.findAll({
            attributes: ['createdAt'],
        });

        const currentDate = new Date();
        const lastTwelveMonths = [];

        for (let i = 0; i < 12; i++) {
            const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const startDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1 + 1);
            const endDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
            // console.log(monthDate);
            // console.log('start: ', startDate);
            // console.log('endDate: ', endDate);

            const monthPlayCount = plays.filter((item) => {
                const itemDate = new Date(item.createdAt);
                return itemDate >= startDate && itemDate < endDate;
            }).length;

            const monthCommentCount = comments.filter((item) => {
                const itemDate = new Date(item.createdAt);
                return itemDate >= startDate && itemDate < endDate;
            }).length;

            lastTwelveMonths.push({
                month: monthDate.toLocaleString('default', { month: 'short' }),
                year: monthDate.getFullYear(),
                totalPlay: monthPlayCount || 0,
                totalComment: monthCommentCount || 0,
            });
        }

        return {
            errCode: 200,
            message: 'Get total plays and comments success',
            data: lastTwelveMonths,
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
        const totalUser = await db.User.count();
        const totalUserFree = await db.User.count({ where: { accountType: 'Free' } });
        const totalUserPremium = await db.User.count({ where: { accountType: 'Premium' } });

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
            totalUser: totalUser,
            totalUserFree: totalUserFree,
            totalUserPremium: totalUserPremium,
            totalUserThisMonth: currentUserCount,
            totalUserLastMonth: prevUserCount,
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
            totalSongs: (await db.Song.count()) || 0,
            totalArtists: (await db.Artist.count()) || 0,
            totalAlbums: (await db.Album.count()) || 0,
            totalPlaylist: (await db.Playlist.count()) || 0,
            totalUsers: (await db.User.count()) || 0,
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
                    [Op.gte]: new Date(today.getFullYear(), today.getMonth() - 1, today.getDate()),
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

        const { album, artists, ...other } = song.toJSON();

        const result = {
            ...other,
            albumId: album.albumId,
            albumTitle: album.title,
            images: album.albumImages,
            artists: artists.map(({ ArtistSong, ...otherArtist }) => ({
                ...otherArtist,
                main: ArtistSong?.main || false,
            })),
            playCount: topSong.playCount,
        };

        return {
            errCode: 200,
            message: `Get Today's Best Song success`,
            song: result,
        };
    } catch (error) {
        return {
            errCode: 500,
            errMess: `Get Today's Best Song failed: ${error.message}`,
        };
    }
};

const getAllSongService = async (query, order, page) => {
    try {
        const limit = 10;
        const skip = (page - 1) * limit;
        const start = (page - 1) * limit;
        const end = start + limit;

        const totalSong = await db.Song.count();
        const totalPage = Math.ceil(totalSong / limit);

        const sortMap = {
            song: 'title',
            album: 'albumTitle',
        };

        const sortMapInt = {
            createdAt: 'createdAt',
            duration: 'duration',
            releaseDate: 'releaseDate',
            totalDownload: 'totalDownload',
            totalPlay: 'totalPlay',
            totalComment: 'totalComment',
            totalLike: 'totalLike',
        };

        const sortMapString = ['title', 'albumTitle'];
        const sortMapNumber = ['duration', 'totalDownload', 'totalPlay', 'totalComment', 'totalLike'];
        const sortMapDate = ['createdAt', 'releaseDate'];

        // const sortField = sortMap[query] || sortMapInt[query] || 'createdAt';
        const sortField = query || 'createdAt';
        order = order || 'high';
        console.log(sortField);
        console.log(order);

        if (page > totalPage || page < 1) {
            return {
                errCode: 400,
                message: 'Requested page number is out of range',
            };
        }

        const songs = await db.Song.findAll({
            attributes: ['id', 'title', 'releaseDate', 'duration', 'lyric', 'filePathAudio', 'createdAt'],
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
                    attributes: ['id', 'name', 'avatar'],
                    through: { attributes: ['main'] },
                },
            ],
            // order: [['createdAt', 'DESC']],
            // limit: limit,
            // offset: skip,
        });

        const totalPlay = await db.SongPlayHistory.findAll({
            where: { songId: { [Op.in]: songs.map((s) => s.id) } },
            attributes: ['songId', [db.Sequelize.fn('COUNT', db.Sequelize.col('historyId')), 'totalPlay']],
            group: ['songId'],
            raw: true,
        });

        const totalComment = await db.Comment.findAll({
            where: { songId: { [Op.in]: songs.map((s) => s.id) } },
            attributes: ['songId', [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'totalComment']],
            group: ['songId'],
            raw: true,
        });

        const totalLike = await db.Like.findAll({
            where: { songId: { [Op.in]: songs.map((s) => s.id) } },
            attributes: ['songId', [db.Sequelize.fn('COUNT', db.Sequelize.col('likeId')), 'totalLike']],
            group: ['songId'],
            raw: true,
        });

        const result = songs.map((s) => {
            const { album, artists, releaseDate, createdAt, ...other } = s.toJSON();
            return {
                ...other,
                releaseDate: formatDateToVietnamTime(releaseDate),
                createdAt: formatDateToVietnamTime(createdAt),
                // releaseDate: new Date(releaseDate),
                // createdAt: new Date(createdAt),
                // ...s.toJSON(),
                albumId: album.albumId,
                albumTitle: album.title,
                images: album.albumImages,
                artists: artists.map(({ ArtistSong, ...otherArtist }) => ({
                    ...otherArtist,
                    main: ArtistSong?.main || false,
                })),
                totalDownload: 0,
                totalPlay: totalPlay.find((t1) => t1.songId === s.id)?.totalPlay || 0,
                totalComment: totalComment.find((t2) => t2.songId === s.id)?.totalComment || 0,
                totalLike: totalLike.find((t3) => t3.songId === s.id)?.totalLike || 0,
            };
        });
        result.sort((a, b) => {
            if (order === 'high') {
                if (sortMapDate.includes(sortField)) {
                    return new Date(b[sortField]) - new Date(a[sortField]);
                } else if (sortMapString.includes(sortField)) {
                    return a[sortField].localeCompare(b[sortField]);
                } else if (sortMapNumber.includes(sortField)) {
                    return b[sortField] - a[sortField];
                }
            } else if (order === 'low') {
                if (sortMapDate.includes(sortField)) {
                    return new Date(a[sortField]) - new Date(b[sortField]);
                } else if (sortMapString.includes(sortField)) {
                    return b[sortField].localeCompare(a[sortField]);
                } else if (sortMapNumber.includes(sortField)) {
                    return a[sortField] - b[sortField];
                }
            }
            return 0;
        });

        console.log(result.length);
        return {
            errCode: 200,
            message: 'Get all song success',
            page: page,
            totalPage: totalPage,
            song: result.slice(start, end),
        };
    } catch (error) {
        return {
            errCode: 500,
            errMess: `Get all Song failed: ${error.message}`,
        };
    }
};

const getSongDetailService = async (songId) => {
    try {
        const song = await db.Song.findOne({
            where: { id: songId },
            attributes: ['id', 'title', 'releaseDate', 'duration', 'lyric', 'filePathAudio', 'createdAt'],
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
                    attributes: ['id', 'name', 'avatar'],
                    through: { attributes: ['main'] },
                },
            ],
        });

        const totalPlay = await db.SongPlayHistory.findOne({
            where: { songId: songId },
            attributes: ['songId', [db.Sequelize.fn('COUNT', db.Sequelize.col('historyId')), 'totalPlay']],
            group: ['songId'],
            raw: true,
        });

        const totalComment = await db.Comment.findOne({
            where: { songId: songId },
            attributes: ['songId', [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'totalComment']],
            group: ['songId'],
            raw: true,
        });

        const totalLike = await db.Like.findOne({
            where: { songId: songId },
            attributes: ['songId', [db.Sequelize.fn('COUNT', db.Sequelize.col('likeId')), 'totalLike']],
            group: ['songId'],
            raw: true,
        });

        const { album, artists, ...other } = song.toJSON();
        const result = {
            ...other,
            albumId: album.albumId,
            albumTitle: album.title,
            images: album.albumImages,
            artists: artists.map(({ ArtistSong, ...otherArtist }) => ({
                ...otherArtist,
                main: ArtistSong?.main || false,
            })),
            totalDownload: 0,
            totalPlay: totalPlay?.totalPlay || 0,
            totalComment: totalComment?.totalComment || 0,
            totalLike: totalLike?.totalLike || 0,
        };

        return {
            errCode: 200,
            message: 'Get song detail success',
            song: result,
        };
    } catch (error) {
        return {
            errCode: 500,
            errMess: `Get song detail failed: ${error.message}`,
        };
    }
};

const updateSongService = async (data) => {
    try {
        const song = await db.Song.findByPk(data.songId);
        if (!song) {
            return {
                errCode: 404,
                message: 'Song not found',
            };
        }

        // if (data.mainArtist) {
        //     await db.ArtistSong.update(data, {where: })
        // }
    } catch (error) {
        return {
            errCode: 500,
            errMess: `Update song failed: ${error.message}`,
        };
    }
};

const createSongService = async (data) => {
    const t = await db.sequelize.transaction();
    try {
        if (!data.title || !data.duration || !data.filePathAudio || !data.mainArtist) {
            return {
                errCode: 400,
                message: 'Missing data',
            };
        }

        const checkSong = await db.Song.findOne({ where: { title: data.title } });
        if (checkSong) {
            const checkArtist = await db.ArtistSong.findOne({
                where: { songId: checkSong.id, artistId: data.mainArtist },
            });
            if (checkArtist) {
                return {
                    errCode: 409,
                    message: 'Song exits',
                };
            }
        }

        const checkArtistSong = await db.Artist.findAll({
            where: {
                id: {
                    [Op.or]: [data.mainArtist, { [Op.in]: data.subArtist.map((a) => a.artistId) }],
                },
            },
            raw: true,
        });

        if (checkArtistSong.length !== data.subArtist.length + 1) {
            return {
                errCode: 404,
                message: 'Artist not found',
            };
        }

        const song = await db.Song.create(
            {
                id: uuidv4(),
                albumId: data.albumId || null,
                title: data.title,
                duration: data.duration,
                lyric: data.lyric || null,
                filePathAudio: data.filePathAudio,
                privacy: false,
                releaseDate: data.releaseDate || new Date(),
            },
            { transaction: t },
        );

        await db.ArtistSong.create(
            {
                artistSongId: uuidv4(),
                songId: song.id,
                artistId: data.mainArtist,
                main: true,
            },
            { transaction: t },
        );

        const subArtistSong = data.subArtist.map((a) => ({
            artistSongId: uuidv4(),
            artistId: a.artistId,
            songId: song.id,
            main: false,
        }));

        await db.ArtistSong.bulkCreate(subArtistSong, { transaction: t });

        await t.commit();

        return {
            errCode: 200,
            message: 'Create song success',
        };
    } catch (error) {
        await t.rollback();
        return {
            errCode: 500,
            errMess: `Update song failed: ${error.message}`,
        };
    }
};

const getAllArtistService = async (query, order, page) => {
    try {
        const limit = 10;
        const skip = (page - 1) * limit;
        const start = (page - 1) * limit;
        const end = start + limit;

        const totalArtist = await db.Artist.count();
        const totalPage = Math.ceil(totalArtist / limit);

        const sortMap = {
            name: 'name',
            song: 'totalSong',
            album: 'totalAlbum',
            follow: 'totalFollow',
            date: 'createdAt',
        };

        const sortField = sortMap[query] || 'createdAt';
        order = order || 'high';
        console.log(sortField);
        console.log(order);

        if (page > totalPage || page < 1) {
            return {
                errCode: 400,
                message: 'Requested page number is out of range',
            };
        }

        const artists = await db.Artist.findAll({
            attributes: ['id', 'name', 'avatar', 'bio', 'createdAt'],
            // order: [['createdAt', 'DESC']],
            // limit: limit,
            // offset: skip,
            raw: true,
        });

        const totalSongs = await db.ArtistSong.findAll({
            where: { artistId: { [Op.in]: artists.map((a) => a.id) }, main: true },
            attributes: ['artistId', [db.Sequelize.fn('COUNT', db.Sequelize.col('songId')), 'totalSongs']],
            group: ['artistId'],
            raw: true,
        });

        const totalFollow = await db.Follow.findAll({
            where: { artistId: { [Op.in]: artists.map((a) => a.id) } },
            attributes: ['artistId', [db.Sequelize.fn('COUNT', db.Sequelize.col('followerId')), 'totalFollow']],
            group: ['artistId'],
            raw: true,
        });

        const result = await Promise.all(
            artists.map(async (artist) => {
                const songIds = await db.ArtistSong.findAll({
                    where: { artistId: artist.id, main: true },
                    attributes: ['songId'],
                });

                const songs = await db.Song.findAll({
                    where: { id: { [Op.in]: songIds.map((id) => id.songId) } },
                    attributes: ['albumId'],
                    raw: true,
                });

                const albumIds = new Set(songs.map((s) => s.albumId));

                const { createdAt, ...other } = artist;

                return {
                    ...other,
                    createdAt: formatDateToVietnamTime(createdAt),
                    totalSong: totalSongs.find((s) => s.artistId === artist.id)?.totalSongs || 0,
                    totalAlbum: albumIds.size,
                    totalFollow: totalFollow.find((f) => f.artistId === artist.id)?.totalFollow || 0,
                };
            }),
        );

        result.sort((a, b) => {
            if (order === 'high') {
                if (sortField === 'createdAt') {
                    return new Date(b[sortField]) - new Date(a[sortField]);
                } else if (sortField === 'name') {
                    return a[sortField].localeCompare(b[sortField]);
                } else {
                    return b[sortField] - a[sortField];
                }
            } else if (order === 'low') {
                if (sortField === 'createdAt') {
                    return new Date(a[sortField]) - new Date(b[sortField]);
                } else if (sortField === 'name') {
                    return b[sortField].localeCompare(a[sortField]);
                } else {
                    return a[sortField] - b[sortField];
                }
            }
            return 0;
        });

        return {
            errCode: 200,
            message: 'Get all artist success',
            page: page,
            totalPage: totalPage,
            artists: result.slice(start, end),
        };
    } catch (error) {
        return {
            errCode: 500,
            errMess: `Get all artist failed: ${error.message}`,
        };
    }
};

module.exports = {
    createService,
    getAllArtistNameService,
    getAllGenreNameService,
    createGenreService,
    createArtistGenreService,
    // -----------
    getRecentUserService,
    getRecentCommentService,
    getTotalPlayAndCmtYearService,
    getUserGrowthService,
    getTotalService,
    getTodayBestSongService,
    // ----------------
    getAllSongService,
    // getAllSongService2,
    getSongDetailService,
    updateSongService,
    createSongService,
    // ------------------
    getAllArtistService,
};
