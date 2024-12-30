import db from '~/models';
import { Op } from 'sequelize';
import { StatusCodes } from 'http-status-codes';
import { v4 as uuidv4 } from 'uuid';
import ApiError from '~/utils/ApiError';
import bcrypt from 'bcryptjs';

import { artistService } from './artistService';
import { albumService } from './albumService';
import { userService } from './userService';
import { awsService } from './awsService';
import { songService } from './songService';
import formatTime from '~/utils/timeFormat';
import { ACCOUNT_STATUS, NOTIFICATIONS, REPORT_STATUS, SUSPENSION_DURATION } from '~/data/enum';
import { emailService } from './emailService';
import encodeData from '~/utils/encryption';
import { appMiddleWare } from '~/middleware/appMiddleWare';
import { sendMessageToUser } from '~/sockets/socketManager';

const saltRounds = 10;
const DO_SPACES_BUCKET = process.env.DO_SPACES_BUCKET;
const DO_SPACES_ENDPOINT = process.env.DO_SPACES_ENDPOINT;

const fetchAlbumSong = async ({ conditions = {}, limit, offset, order, mode = 'findAll' } = {}) => {
    const albumIds = await db.AlbumSong[mode]({
        where: conditions,
        attributes: ['albumId', 'songId'],
        limit: limit,
        offset: offset,
        order: order,
        raw: true,
    });
    return albumIds;
};

const getTotalPlayAndCmtYearService = async () => {
    try {
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
            data: lastTwelveMonths,
        };
    } catch (error) {
        throw error;
    }
};

const getUserGrowthService = async () => {
    try {
        const totalUser = await db.User.count();
        const totalUserFree = await db.User.count({ where: { accountType: 'FREE' } });
        const totalUserPremium = await db.User.count({ where: { accountType: 'PREMIUM' } });

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
            growth: growth,
            totalUser: totalUser,
            totalUserFree: totalUserFree,
            totalUserPremium: totalUserPremium,
            totalUserThisMonth: currentUserCount,
            totalUserLastMonth: prevUserCount,
        };
    } catch (error) {
        throw error;
    }
};

const getTotalService = async () => {
    try {
        const data = {
            totalSongs: (await db.Song.count({ where: { privacy: false } })) || 0,
            totalArtists: (await db.Artist.count()) || 0,
            totalAlbums: (await db.Album.count()) || 0,
            totalPlaylist: (await db.Playlist.count()) || 0,
            totalUsers: (await db.User.count()) || 0,
        };

        return {
            data: data,
        };
    } catch (error) {
        throw error;
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

        if (topSong) {
            const song = await songService.fetchSongs({ conditions: { id: topSong.songId }, mode: 'findOne' });

            const { album, artists, totalPlay, ...other } = song;

            const result = {
                ...other,
                albumId: album.albumId,
                albumTitle: album.title,
                album: album,
                artists: artists.map(({ ArtistSong, ...otherArtist }) => ({
                    ...otherArtist,
                    main: ArtistSong?.main || false,
                })),
                playCount: totalPlay,
            };

            return {
                song: result,
            };
        } else {
            return { song: {} };
        }
    } catch (error) {
        throw error;
    }
};

const getAllAlbumService = async (query, order, page) => {
    try {
        const limit = 10;
        const offset = (page - 1) * limit;
        const start = (page - 1) * limit;
        const end = start + limit;

        const [totalAlbum, albums] = await Promise.all([
            albumService.fetchAlbumCount(),
            albumService.fetchAlbum({ order: [['updatedAt', 'DESC']] }),
        ]);

        const result = await Promise.all(
            albums.map(async (album) => {
                const firstSongOfAlbum = await db.AlbumSong.findOne({
                    where: { albumId: album.albumId },
                    attributes: ['songId'],
                });

                if (!firstSongOfAlbum) {
                    return {
                        ...album,
                        totalSong: 0,
                        mainArtist: null,
                    };
                }

                const mainArtistId = await artistService.fetchMainArtist({
                    conditions: { songId: firstSongOfAlbum.songId, main: true },
                });

                const totalSong = await db.AlbumSong.count({ where: { albumId: album.albumId } });

                const mainArtist = await artistService.fetchArtist({
                    mode: 'findOne',
                    conditions: { id: mainArtistId.artistId },
                });
                return {
                    ...album,
                    totalSong: totalSong,
                    mainArtist: mainArtist ?? null,
                };
            }),
        );

        return {
            page: page,
            totalPage: Math.ceil(totalAlbum / limit),
            data: result.slice(start, end),
        };
    } catch (error) {
        throw error;
    }
};

const getAllArtistNameService = async () => {
    try {
        const artists = await db.Artist.findAll({
            attributes: ['id', 'name'],
            order: [['updatedAt', 'DESC']],
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

const getAllUserService = async ({ page = 1, limit = 10 } = {}) => {
    try {
        const offset = (page - 1) * limit;

        const [totalUser, users] = await Promise.all([
            userService.fetchUserCount(),
            userService.fetchUser({
                order: [['createdAt', 'desc']],
                group: ['id'],
                limit: limit,
                offset: offset,
                conditions: { role: 'User' },
            }),
        ]);

        const result = users.map((user) => {
            const { status, ...other } = user;
            let statusMessage = ACCOUNT_STATUS[status];
            return {
                ...other,
                status2: statusMessage,
                totalViolation: Math.floor(Math.random() * (100 - 1 + 1)) + 1,
            };
        });

        return {
            page: page,
            totalPage: Math.ceil(totalUser / limit),
            users: result,
        };
    } catch (error) {
        throw error;
    }
};

const getAllReportService = async ({ page = 1, limit = 10 } = {}) => {
    try {
        const offset = (page - 1) * limit;

        const reports = await db.Report.findAll({
            order: [['updatedAt', 'DESC']],
            include: [
                { model: db.User, as: 'user', attributes: ['id', 'name', 'username', 'email', 'image', 'createdAt'] },
                { model: db.Comment, as: 'comment', include: [{ model: db.Song, as: 'song' }] },
            ],
            limit: limit,
            offset: offset,
        });

        const formatters = reports.map((r) => {
            const formatter = { ...r.toJSON() };

            delete formatter.userId;
            delete formatter.commentId;

            formatter.status = REPORT_STATUS[formatter.status];
            formatter.createdAt = formatTime(formatter.createdAt);
            formatter.updatedAt = formatTime(formatter.updatedAt);
            if (formatter.user) {
                formatter.user.image =
                    formatter.user.image && formatter.user.image.includes('PBL6')
                        ? `https://${DO_SPACES_BUCKET}.${DO_SPACES_ENDPOINT}/${formatter.user.image}`
                        : formatter.user.image;
                formatter.user.createdAt = formatTime(formatter.user.createdAt);
            }
            formatter.comment.createdAt = formatTime(formatter.comment.createdAt);
            formatter.comment.updatedAt = formatTime(formatter.comment.updatedAt);
            formatter.comment.song.createdAt = formatTime(formatter.comment.song.createdAt);
            formatter.comment.song.updatedAt = formatTime(formatter.comment.song.updatedAt);
            formatter.comment.song.releaseDate = formatTime(formatter.comment.song.releaseDate);
            if (formatter.comment.song.lyric) formatter.comment.song.lyric = encodeData(formatter.comment.song.lyric);
            if (formatter.comment.song.filePathAudio)
                formatter.comment.song.filePathAudio = encodeData(formatter.comment.song.filePathAudio);

            return formatter;
        });

        return formatters;
    } catch (error) {
        throw error;
    }
};

const getReportService = async (reportId) => {
    try {
        const report = await db.Report.findOne({
            where: { id: reportId },
            attributes: ['id', 'content', 'status', 'createdAt', 'updatedAt'],
            include: [
                { model: db.User, as: 'user', attributes: ['id', 'name', 'username', 'email', 'image', 'createdAt'] },
                { model: db.Comment, as: 'comment', include: [{ model: db.Song, as: 'song' }] },
            ],
        });

        if (!report) throw new ApiError(StatusCodes.NOT_FOUND, 'Report not found');
        const formatter = report.toJSON();

        if (formatter.comment.commentParentId) {
            const commentParent = await db.Comment.findOne({
                where: { id: formatter.comment.commentParentId },
                attributes: ['id', 'content', 'createdAt'],
                include: [
                    { model: db.User, as: 'user', attributes: ['id', 'username', 'name', 'image', 'accountType'] },
                ],
            });

            const format = commentParent.toJSON();
            format.createdAt = formatTime(format.createdAt);
            format.user.image =
                format.user.image && format.user.image.includes('PBL6')
                    ? `https://${DO_SPACES_BUCKET}.${DO_SPACES_ENDPOINT}/${format.user.image}`
                    : format.user.image;

            formatter.comment.commentParent = format;
        }

        delete formatter.userId;
        delete formatter.commentId;

        formatter.createdAt = formatTime(formatter.createdAt);
        formatter.updatedAt = formatTime(formatter.updatedAt);
        if (formatter.user) {
            formatter.user.image =
                formatter.user.image && formatter.user.image.includes('PBL6')
                    ? `https://${DO_SPACES_BUCKET}.${DO_SPACES_ENDPOINT}/${formatter.user.image}`
                    : formatter.user.image;
            formatter.user.createdAt = formatTime(formatter.user.createdAt);
        }
        formatter.comment.createdAt = formatTime(formatter.comment.createdAt);
        formatter.comment.updatedAt = formatTime(formatter.comment.updatedAt);
        formatter.comment.song.createdAt = formatTime(formatter.comment.song.createdAt);
        formatter.comment.song.updatedAt = formatTime(formatter.comment.song.updatedAt);
        formatter.comment.song.releaseDate = formatTime(formatter.comment.song.releaseDate);
        if (formatter.comment.song.lyric) formatter.comment.song.lyric = encodeData(formatter.comment.song.lyric);
        if (formatter.comment.song.filePathAudio)
            formatter.comment.song.filePathAudio = encodeData(formatter.comment.song.filePathAudio);
        return formatter;
    } catch (error) {
        throw error;
    }
};

const hideCommentAndChildren = async (commentId, transaction) => {
    // Ẩn comment hiện tại
    await db.Comment.update({ hide: true }, { where: { id: commentId }, transaction });

    // Tìm tất cả các comment con
    const childComments = await db.Comment.findAll({
        where: { commentParentId: commentId },
    });

    // Đệ quy ẩn các comment con
    for (const child of childComments) {
        await hideCommentAndChildren(child.id, transaction);
    }
};

const verifyReportService = async (reportId) => {
    const transaction = await db.sequelize.transaction();
    try {
        const report = await db.Report.findByPk(reportId);
        const comment = await db.Comment.findByPk(report.commentId);

        if (!report) throw new ApiError(StatusCodes.NOT_FOUND, 'Comment not found');
        if (report.status !== 'PENDING')
            throw new ApiError(StatusCodes.CONFLICT, 'The reported comment has already been verified');

        const [reportResult, noti, commentResult] = await Promise.all([
            db.Report.update({ status: 'DELETE' }, { where: { id: reportId }, transaction }),
            // db.Comment.update({ hide: true }, { where: { id: report.commentId }, transaction }),
            db.Notifications.create(
                {
                    userId: comment.userId,
                    type: 'COMMENT',
                    message: `Your comment has been deleted`,
                    from: report.id,
                },
                { transaction },
            ),
            hideCommentAndChildren(report.commentId, transaction),
        ]);

        if (reportResult[0] === 1) {
            const [count, user] = await Promise.all([
                db.Comment.count({ where: { userId: comment.userId, hide: true } }),
                db.User.findByPk(comment.userId),
            ]);
            switch (count) {
                case 3:
                    const [warnNoti] = await Promise.all([
                        db.Notifications.create({
                            userId: user.id,
                            type: 'SYSTEM',
                            message:
                                'Your comments have violated community standards multiple times. If they continue, your account will be temporarily locked.',
                        }),
                        emailService.emailWarnAccount({
                            email: user.email,
                            username: user.username,
                        }),
                    ]);
                    sendMessageToUser(user.id, 'newNoti', warnNoti);
                    break;
                case 7:
                    await db.User.update({ status: 'LOCK3' }, { where: { id: user.id }, transaction });
                    await emailService.emailNotiLockAccount({
                        email: user.email,
                        username: user.username,
                        time: ACCOUNT_STATUS.LOCK3,
                    });
                    break;
                case 10:
                    await db.User.update({ status: 'LOCK7' }, { where: { id: user.id }, transaction });
                    await emailService.emailNotiLockAccount({
                        email: user.email,
                        username: user.username,
                        time: ACCOUNT_STATUS.LOCK7,
                    });
                    break;
                case 15:
                    await db.User.update({ status: 'PERMANENT' }, { where: { id: user.id }, transaction });
                    await emailService.emailNotiLockAccount({
                        email: user.email,
                        username: user.username,
                        time: ACCOUNT_STATUS.PERMANENT,
                    });
                    break;
                default:
                    break;
            }
        }

        sendMessageToUser(comment.userId, 'newNoti', noti);
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

const rejectReportService = async (reportId) => {
    const transaction = await db.sequelize.transaction();
    try {
        const report = await db.Report.findByPk(reportId);
        // const comment = await db.Comment.findByPk(report.commentId);

        if (!report) throw new ApiError(StatusCodes.NOT_FOUND, 'Comment not found');
        if (report.status !== 'PENDING')
            throw new ApiError(StatusCodes.CONFLICT, 'The reported comment has already been verified');

        await db.Report.update({ status: 'NOTDELETE' }, { where: { id: reportId }, transaction });
        // const noti = await db.Notifications.create(
        //     {
        //         userId: report.userId,
        //         type: 'COMMENT',
        //         message: 'Your report comment has been cancelled.',
        //         from: report.id,
        //     },
        //     { transaction },
        // );
        // sendMessageToUser(report.userId, 'newNoti', noti);
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

const getAllPaymentService = async ({ page = 1, limit = 10 } = {}) => {
    try {
        const offset = (page - 1) * limit;

        const [totalPayment, payments] = await Promise.all([
            db.Subscriptions.count(),
            db.Subscriptions.findAll({
                order: [['updatedAt', 'desc']],
                include: [
                    {
                        model: db.User,
                        as: 'user',
                        attributes: ['id', 'username', 'name', 'email', 'image', 'status', 'createdAt'],
                    },
                    { model: db.SubscriptionPackage, as: 'package' },
                ],
                limit: limit,
                offset: offset,
            }),
        ]);

        const formatters = payments.map((p) => {
            const formatter = p.toJSON();
            delete formatter.userId;
            delete formatter.packageId;
            formatter.startDate = formatTime(formatter.startDate);
            formatter.endDate = formatTime(formatter.endDate);
            formatter.createdAt = formatTime(formatter.createdAt);
            formatter.updatedAt = formatTime(formatter.updatedAt);
            formatter.user.createdAt = formatTime(formatter.user.createdAt);
            formatter.package.createdAt = formatTime(formatter.package.createdAt);
            formatter.package.updatedAt = formatTime(formatter.package.updatedAt);
            return formatter;
        });

        return {
            page: page,
            totalPage: Math.ceil(totalPayment / limit),
            payments: formatters,
        };
    } catch (error) {
        throw error;
    }
};

const getPaymentDetailService = async ({ user, paymentId } = {}) => {
    try {
        const checkPayment = await db.Subscriptions.findByPk(paymentId);
        if (!checkPayment) throw new ApiError(StatusCodes.NOT_FOUND, 'Payment not found');
        if (!(checkPayment.userId === user.id || user.role === 'Admin'))
            throw new ApiError(StatusCodes.FORBIDDEN, 'You do not have access');

        const payment = await db.Subscriptions.findOne({
            where: { id: paymentId },
            include: [
                {
                    model: db.User,
                    as: 'user',
                    attributes: ['id', 'username', 'name', 'email', 'image', 'status', 'createdAt'],
                },
                { model: db.SubscriptionPackage, as: 'package' },
            ],
        });

        const formatter = payment.toJSON();
        delete formatter.userId;
        delete formatter.packageId;
        formatter.startDate = formatTime(formatter.startDate);
        formatter.endDate = formatTime(formatter.endDate);
        formatter.createdAt = formatTime(formatter.createdAt);
        formatter.updatedAt = formatTime(formatter.updatedAt);
        formatter.user.createdAt = formatTime(formatter.user.createdAt);
        formatter.package.createdAt = formatTime(formatter.package.createdAt);
        formatter.package.updatedAt = formatTime(formatter.package.updatedAt);
        return formatter;
    } catch (error) {
        throw error;
    }
};

// ---------------------------

const createSongService = async ({ data, files } = {}) => {
    const transaction = await db.sequelize.transaction();
    const songId = uuidv4();

    try {
        const dataCreateSong = {
            id: songId,
        };

        // check artist
        const checkMainArtist = await artistService.checkArtistExits(data.mainArtistId);
        if (!checkMainArtist) throw new ApiError(StatusCodes.NOT_FOUND, 'Artist not found');

        // check sub artist
        if (data.subArtistIds.length > 0) {
            data.subArtistIds.map(async (sub) => {
                const checkSubArtist = await artistService.checkArtistExits(sub.artistId);
                if (!checkSubArtist) throw new ApiError(StatusCodes.NOT_FOUND, 'Sub artist not found');
            });
        }

        if (files.audioFile.length == 0) throw new ApiError(StatusCodes.BAD_REQUEST, 'File required');

        if (files.audioFile && files.audioFile.length > 0) {
            dataCreateSong.filePathAudio = files.audioFile[0].key;
            console.log('key: ', files.audioFile[0].key);

            const duration = await appMiddleWare.getAudioDuration(files.audioFile[0].key);
            dataCreateSong.duration = duration ? parseInt(duration * 1000) : 0;
        }

        if (files.lyricFile && files.lyricFile.length > 0) dataCreateSong.lyric = files.lyricFile[0].key;

        if (data.title) dataCreateSong.title = data.title;

        if (data.releaseDate) dataCreateSong.releaseDate = data.releaseDate;

        let dataCreateSubArtist;
        if (data.subArtistIds)
            dataCreateSubArtist = data.subArtistIds.map((sub) => {
                return {
                    songId: songId,
                    artistId: sub.artistId,
                    main: false,
                };
            });

        await db.Song.create(dataCreateSong, { transaction });
        await Promise.all([
            db.ArtistSong.create(
                {
                    songId: songId,
                    artistId: data.mainArtistId,
                    main: true,
                },
                { transaction },
            ),
            db.ArtistSong.bulkCreate(dataCreateSubArtist, { transaction }),
        ]);

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();

        if (files.audioFile && files.audioFile.length > 0)
            setImmediate(() => awsService.deleteFile3(files.audioFile[0].key));

        if (files.lyricFile && files.lyricFile.length > 0)
            setImmediate(() => awsService.deleteFile3(files.lyricFile[0].key));

        throw error;
    }
};

const createAlbum = async ({ data, file } = {}) => {
    const transaction = await db.sequelize.transaction();
    try {
        const albumId = uuidv4();
        const dataCreateAlbum = {
            albumId: albumId,
        };
        if (data.title) dataCreateAlbum.title = data.title;
        if (data.type) dataCreateAlbum.albumType = data.type;
        if (data.releaseDate) dataCreateAlbum.releaseDate = data.releaseDate;

        const albumCover = file.albumCover && file.albumCover.length > 0 ? file.albumCover[0].key : null;

        await db.Album.create(dataCreateAlbum, { transaction });

        await db.AlbumImage.create(
            {
                albumId: albumId,
                image: albumCover,
                size: 10,
            },
            { transaction },
        );

        let dataSong;
        if (data.songIds) {
            dataSong = data.songIds.map((s) => {
                return { songId: s.songId, albumId: albumId };
            });
        }

        await db.AlbumSong.bulkCreate(dataSong, { transaction });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();

        if (file.albumCover && file.albumCover.length > 0)
            setImmediate(() => awsService.deleteFile3(file.albumCover[0].key));

        throw error;
    }
};

const createAdminService = async ({ data } = {}) => {
    try {
        const hashPass = await bcrypt.hash(data.password, saltRounds);
        data.password = hashPass;
        data.role = 'Admin';
        data.statusPassword = false;
        data.accountType = 'Free';
        data.status = true;

        await db.User.create(data);
    } catch (error) {
        throw error;
    }
};

// -----------------------------------------------------------------------------------------------

const updateAlbumService = async ({ albumId, data, file } = {}) => {
    const transaction = await db.sequelize.transaction();
    try {
        const updatesAlbum = {};
        const updatesAlbumImage = {};

        // check album
        const checkAlbum = await db.Album.findOne({
            where: { albumId: albumId },
            include: [{ model: db.AlbumImage, as: 'albumImages' }],
        });
        if (!checkAlbum) throw new ApiError(StatusCodes.NOT_FOUND, 'Album not found');

        const songsOfAlbum = await db.AlbumSong.findAll({ where: { albumId: albumId }, attributes: ['songId'] });

        const songIds = data.songIds ?? [];
        const songIdsOfAlbum = songsOfAlbum?.map((rec) => rec.songId);
        const songsAdd = songIds?.filter((id) => !songIdsOfAlbum.includes(id));
        const songsDel = songIdsOfAlbum?.filter((id) => !songIds.includes(id));

        if (songsDel.length > 0)
            await db.AlbumSong.destroy({ where: { albumId: albumId, songId: { [Op.in]: songsDel } }, transaction });

        if (songsAdd.length > 0) {
            const foundSongs = (
                await db.Song.findAll({ where: { id: { [Op.in]: songsAdd } }, attributes: ['id'] })
            ).map((s) => s.id);

            const invalidSongIds = songsAdd.filter((id) => !foundSongs.includes(id));
            if (invalidSongIds.length > 0) {
                throw new ApiError(StatusCodes.BAD_REQUEST, `Song IDs do not exist: ${invalidSongIds.join(', ')}`);
            }

            const createData = songsAdd.map((s) => {
                return { songId: s, albumId: albumId };
            });
            await db.AlbumSong.bulkCreate(createData, { transaction });
        }

        if (data.title) updatesAlbum.title = data.title;
        if (data.albumType) updatesAlbum.albumType = data.albumType;
        if (data.releaseDate) updatesAlbum.releaseDate = data.releaseDate;

        if (file.albumCover && file.albumCover.length > 0) {
            updatesAlbumImage.image = file.albumCover[0].key;
            updatesAlbumImage.size = 10;
        }

        await Promise.all([
            db.Album.update(updatesAlbum, { where: { albumId: albumId }, transaction }),
            db.AlbumImage.update(updatesAlbumImage, { where: { albumId: albumId }, transaction }),
        ]);

        await transaction.commit();

        if (file.albumCover && file.albumCover.length > 0 && checkAlbum.albumImages) {
            checkAlbum.albumImages.forEach((image) => {
                if (image.image && image.image.includes('PBL6')) {
                    console.log('delete image: ', image.image);
                    setImmediate(() => awsService.deleteFile3(image.image));
                }
            });
        }
    } catch (error) {
        await transaction.rollback();

        if (file.albumCover && file.albumCover.length > 0)
            setImmediate(() => awsService.deleteFile3(file.albumCover[0].key));

        throw error;
    }
};

const updateArtistService = async ({ artistId, data, file } = {}) => {
    const transaction = await db.sequelize.transaction();
    try {
        const updates = {};

        // check artist
        const checkArtist = await db.Artist.findByPk(artistId);
        if (!checkArtist) throw new ApiError(StatusCodes.NOT_FOUND, 'Artist not found');

        // check genre exist
        const genreIds = data.genres ?? [];
        const genres = await db.Genre.findAll({ attributes: ['genreId'], raw: true });
        const existingGenreIds = new Set(genres.map((genre) => genre.genreId));
        const missingGenreIds = genreIds.filter((genreId) => !existingGenreIds.has(genreId));

        if (missingGenreIds.length > 0) {
            throw new ApiError(StatusCodes.BAD_REQUEST, `Genre IDs do not exist: ${missingGenreIds.join(', ')}`);
        }

        // lấy ra genre của artist
        const genresOfArtist = await db.ArtistGenre.findAll({
            where: { artistId: artistId },
            attributes: ['genreId'],
            raw: true,
        });
        const genreIdsOfArtist = genresOfArtist?.map((rec) => rec.genreId);

        const genresAdd = genreIds?.filter((id) => !genreIdsOfArtist.includes(id));
        const genresDel = genreIdsOfArtist?.filter((id) => !genreIds.includes(id));

        if (genresDel.length > 0) {
            await db.ArtistGenre.destroy({
                where: { artistId: artistId, genreId: { [Op.in]: genresDel } },
                transaction,
            });
        }
        if (genresAdd.length > 0) {
            const createData = genresAdd.map((g) => ({
                artistId: artistId,
                genreId: g,
            }));
            await db.ArtistGenre.bulkCreate(createData, { transaction });
        }

        if (file.avatar && file.avatar.length > 0) updates.avatar = file.avatar[0].key;

        if (data.name) updates.name = data.name;

        if (data.bio) updates.bio = data.bio;

        await db.Artist.update(updates, { where: { id: artistId }, transaction });
        await transaction.commit();

        if (file.avatar && file.avatar.length > 0 && checkArtist.avatar)
            setImmediate(() => awsService.deleteFile3(checkArtist.avatar));
    } catch (error) {
        await transaction.rollback();

        if (file.avatar && file.avatar.length > 0) SetImmediate(() => awsService.deleteFile3(file.avatar[0].key));

        throw error;
    }
};

const updateSongService = async ({ songId, data, files } = {}) => {
    const transaction = await db.sequelize.transaction();
    try {
        const updates = {};

        const subArtistIds = data.subArtist ?? [];
        if (subArtistIds.includes(data.mainArtist)) throw new ApiError(StatusCodes.CONFLICT, 'Only 1 main artist');

        const song = await db.Song.findOne({ where: { id: songId, privacy: false } });
        if (!song) throw new ApiError(StatusCodes.NOT_FOUND, 'Song not found');

        if (data.title) updates.title = data.title;

        if (data.releaseDate) updates.releaseDate = data.releaseDate;

        if (data.mainArtist)
            await db.ArtistSong.update(
                { artistId: data.mainArtist },
                { where: { songId: songId, main: true }, transaction },
            );

        if (files.audioFile && files.audioFile.length > 0) {
            updates.filePathAudio = files.audioFile[0].key;

            const duration = await appMiddleWare.getAudioDuration(files.audioFile[0].key);
            updates.duration = duration ? parseInt(duration * 1000) : 0;
        }

        if (files.lyricFile && files.lyricFile.length > 0) updates.lyric = files.lyricFile[0].key;

        const subArtistIdsOfSong = await db.ArtistSong.findAll({ where: { songId: songId, main: false } });

        const subArtistIdsOfSongMap = subArtistIdsOfSong.map((a) => a.artistId);
        const subArtistAdd = subArtistIds?.filter((id) => !subArtistIdsOfSongMap.includes(id));
        const subArtistDel = subArtistIdsOfSongMap?.filter((id) => !subArtistIds.includes(id));

        if (subArtistDel.length > 0) {
            await db.ArtistSong.destroy(
                { where: { songId: songId, artistId: { [Op.in]: subArtistDel } } },
                { transaction },
            );
        }

        if (subArtistAdd.length > 0) {
            const addPromises = subArtistAdd.map((artistId) =>
                db.ArtistSong.create({ artistId: artistId, songId: songId, main: false }, { transaction }),
            );
            await Promise.all(addPromises);
        }

        await db.Song.update(updates, { where: { id: songId }, transaction });

        await transaction.commit();

        if (files.audioFile && files.audioFile.length > 0 && song.filePathAudio)
            setImmediate(() => awsService.deleteFile3(song.filePathAudio));
        if (files.lyricFile && files.lyricFile.length > 0 && song.lyric)
            setImmediate(() => awsService.deleteFile3(song.lyric));

        return {
            mainArtist: data.mainArtist,
            subArtistAdd: subArtistAdd,
            subArtistDel: subArtistDel,
        };
    } catch (error) {
        await transaction.rollback();

        if (files.audioFile && files.audioFile.length > 0)
            setImmediate(() => awsService.deleteFile3(files.audioFile[0].key));

        if (files.lyricFile && files.lyricFile.length > 0)
            setImmediate(() => awsService.deleteFile3(files.lyricFile[0].key));

        throw error;
    }
};

const updateGenreService = async ({ genreId, data } = {}) => {
    try {
        const checkGenre = await db.Genre.findByPk(genreId);
        if (!checkGenre) throw new ApiError(StatusCodes.NOT_FOUND, 'Genre not found');

        const normalizedName = data.name.trim().toLowerCase();

        const existGenre = await db.Genre.findOne({
            where: {
                name: db.Sequelize.where(db.Sequelize.fn('LOWER', db.Sequelize.col('name')), '=', normalizedName),
            },
        });

        if (existGenre) throw new ApiError(StatusCodes.CONFLICT, 'Genre name already exists');

        await db.Genre.update({ name: data.name }, { where: { genreId: genreId } });
        const genre = await db.Genre.findByPk(genreId);
        return { genre: genre };
    } catch (error) {
        throw error;
    }
};

// -----------------------------------------------------------------------------------------------

const deleteAlbumService = async ({ albumIds } = {}) => {
    const transaction = await db.sequelize.transaction();
    try {
        const albums = await db.Album.findAll({
            where: { albumId: { [Op.in]: albumIds } },
            include: [{ model: db.AlbumImage, as: 'albumImages' }],
        });

        await Promise.all([
            db.AlbumSong.destroy({ where: { albumId: { [Op.in]: albumIds } }, transaction }),
            db.AlbumImage.destroy({ where: { albumId: { [Op.in]: albumIds } }, transaction }),
        ]);
        await db.Album.destroy({ where: { albumId: { [Op.in]: albumIds } }, transaction });

        await transaction.commit();

        albums.map((allbum) => {
            if (allbum.albumImages) {
                allbum.albumImages.forEach((image) => {
                    if (image.image && image.image.includes('PBL6'))
                        setImmediate(() => awsService.deleteFile3(image.image));
                });
            }
        });
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

const deleteArtistService = async ({ artistIds } = {}) => {
    const transaction = await db.sequelize.transaction();
    try {
        const artists = await db.Artist.findAll({ where: { id: { [Op.in]: artistIds } }, raw: true });

        const songIds = await db.ArtistSong.findAll({
            where: { artistId: { [Op.in]: artistIds }, main: true },
            attributes: ['songId'],
            raw: true,
        });
        const comments = await db.Comment.findAll({
            where: { songId: { [Op.in]: songIds.map((s) => s.songId) } },
            raw: true,
        });

        await Promise.all([
            db.ArtistGenre.destroy({ where: { artistId: { [Op.in]: artistIds } }, transaction }),
            db.ArtistSong.destroy({ where: { artistId: { [Op.in]: artistIds } }, transaction }),
            db.Follow.destroy({ where: { artistId: { [Op.in]: artistIds } }, transaction }),
            db.Artist.update(
                { avatar: null, bio: null, hide: true },
                { where: { id: { [Op.in]: artistIds } }, transaction },
            ),
            db.Report.destroy({
                where: { commentId: { [Op.in]: comments?.map((c) => c.id) } },
                transaction,
            }),
            db.Like.destroy({
                where: { songId: { [Op.in]: songIds?.map((s) => s.songId) } },
                transaction,
            }),
            db.SongPlayHistory.destroy({
                where: { songId: { [Op.in]: songIds?.map((s) => s.songId) } },
                transaction,
            }),
            db.PlaylistSong.destroy({
                where: { songId: { [Op.in]: songIds?.map((s) => s.songId) } },
                transaction,
            }),
        ]);

        await Promise.all([
            db.Comment.destroy({
                where: { id: { [Op.in]: comments?.map((c) => c.id) } },
                transaction,
            }),
            db.Song.destroy({
                where: { id: { [Op.in]: songIds?.map((s) => s.songId) } },
                transaction,
            }),
        ]);
        await db.Artist.update({ hide: true }, { where: { id: { [Op.in]: artistIds } }, transaction });

        await transaction.commit();

        artists.map((a) => {
            if (a.avatar && a.avatar.includes('PBL6')) setImmediate(() => awsService.deleteFile3(a.avatar));
        });

        songIds.map((s) => {
            if (s.filePathAudio && s.filePathAudio.includes('PBL6'))
                setImmediate(() => awsService.deleteFile3(s.filePathAudio));
        });
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

const deleteSongService = async ({ songIds } = {}) => {
    const transaction = await db.sequelize.transaction();
    try {
        const [songs] = await Promise.all([
            db.Song.findAll({ where: { id: { [Op.in]: songIds } } }),
            db.Like.destroy({ where: { songId: { [Op.in]: songIds } }, transaction }),
            db.Comment.destroy({ where: { songId: { [Op.in]: songIds } }, transaction }),
            db.SongPlayHistory.destroy({ where: { songId: { [Op.in]: songIds } }, transaction }),
            db.PlaylistSong.destroy({ where: { songId: { [Op.in]: songIds } }, transaction }),
            db.ArtistSong.destroy({ where: { songId: { [Op.in]: songIds } }, transaction }),
            db.AlbumSong.destroy({ where: { songId: { [Op.in]: songIds } }, transaction }),
            db.Download.destroy({ where: { songId: { [Op.in]: songIds } }, transaction }),
        ]);

        await db.Song.destroy({ where: { id: { [Op.in]: songIds } }, transaction });

        await transaction.commit();

        songs.map((s) => {
            if (s.filePathAudio && s.filePathAudio.includes('PBL6'))
                setImmediate(() => awsService.deleteFile3(s.filePathAudio));

            if (s.lyric && s.lyric.includes('PBL6')) setImmediate(() => awsService.deleteFile3(s.lyric));
        });
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

const deleteGenreService = async ({ genreIds } = {}) => {
    const transaction = await db.sequelize.transaction();
    try {
        await db.ArtistGenre.destroy({
            where: { genreId: { [Op.in]: genreIds } },
            transaction,
        });
        await db.Genre.destroy({
            where: { genreId: { [Op.in]: genreIds } },
            transaction,
        });
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

const deletePaymentService = async ({ paymentIds } = {}) => {
    const transaction = await db.sequelize.transaction();
    try {
        await db.Notifications.destroy({ where: { from: { [Op.in]: paymentIds } }, transaction });
        await db.Subscriptions.destroy({ where: { id: { [Op.in]: paymentIds } }, transaction });
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

export const adminService = {
    fetchAlbumSong,
    // ---------------
    getTotalPlayAndCmtYearService,
    getUserGrowthService,
    getTotalService,
    getTodayBestSongService,
    // ---------------------------
    getAllAlbumService,
    getAllArtistNameService,
    getAllUserService,
    getAllReportService,
    getReportService,
    verifyReportService,
    rejectReportService,
    getAllPaymentService,
    getPaymentDetailService,
    // ------------create
    createSongService,
    createAlbum,
    createAdminService,
    // -----------------
    updateAlbumService,
    updateArtistService,
    updateSongService,
    updateGenreService,
    // -----------------
    deleteAlbumService,
    deleteArtistService,
    deleteSongService,
    deleteGenreService,
    deletePaymentService,
};
