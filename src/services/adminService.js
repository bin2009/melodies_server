import db from '~/models';
import { Op } from 'sequelize';
import { StatusCodes } from 'http-status-codes';
import { v4 as uuidv4 } from 'uuid';
import ApiError from '~/utils/ApiError';
import sharp from 'sharp';
import bcrypt from 'bcryptjs';

import { artistService } from './artistService';
import { albumService } from './albumService';
import { userService } from './userService';
import { awsService } from './awsService';
import { songService } from './songService';
import formatTime from '~/utils/timeFormat';
import { ACCOUNT_STATUS, NOTIFICATIONS, SUSPENSION_DURATION } from '~/data/enum';
import { emailService } from './emailService';
import encodeData from '~/utils/encryption';

const saltRounds = 10;

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
            albumService.fetchAlbum({ order: [['createdAt', 'DESC']] }),
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

const getAllUserService = async ({ page = 1, limit = 10 } = {}) => {
    try {
        const offset = (page - 1) * limit;

        const [totalUser, users] = await Promise.all([
            userService.fetchUserCount(),
            userService.fetchUser({ group: ['id'], limit: limit, offset: offset }),
        ]);

        const result = users.map((user) => {
            let statusMessage = ACCOUNT_STATUS[user.status];
            return {
                ...user,
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
            order: [['createdAt', 'DESC']],
            include: [
                { model: db.User, as: 'user', attributes: ['id', 'name', 'username', 'email', 'image', 'createdAt'] },
                { model: db.Comment, as: 'comment', include: [{ model: db.Song, as: 'song' }] },
            ],
            limit: limit,
            offset: offset,
        });

        const formatters = reports.map((r) => {
            const formatter = { ...r.toJSON() };
            formatter.createdAt = formatTime(formatter.createdAt);
            formatter.updatedAt = formatTime(formatter.updatedAt);
            formatter.user.createdAt = formatTime(formatter.user.createdAt);
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
        formatter.createdAt = formatTime(formatter.createdAt);
        formatter.updatedAt = formatTime(formatter.updatedAt);
        formatter.user.createdAt = formatTime(formatter.user.createdAt);
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

const verifyReportService = async (reportId) => {
    const transaction = await db.sequelize.transaction();
    try {
        const report = await db.Report.findByPk(reportId);
        const comment = await db.Comment.findByPk(report.commentId);

        if (!report) throw new ApiError(StatusCodes.NOT_FOUND, 'Comment not found');
        // if (report.status) throw new ApiError(StatusCodes.CONFLICT, 'The reported comment has already been verified');

        const [reportResult, commentResult] = await Promise.all([
            db.Report.update({ status: true }, { where: { id: reportId }, transaction }),
            db.Comment.update({ hide: true }, { where: { id: report.commentId }, transaction }),
            db.Notifications.create(
                {
                    userId: comment.userId,
                    type: NOTIFICATIONS.COMMENT_VIOLATION,
                    message: comment.content,
                    from: comment.id,
                },
                { transaction },
            ),
        ]);

        if (reportResult[0] === 1) {
            const count = await db.Comment.count({ where: { userId: comment.userId, hide: true } });
            const user = await db.User.findByPk(comment.userId);
            switch (count) {
                case 3:
                    await emailService.emailWarnAccount({
                        email: user.email,
                        username: user.username,
                    });
                    break;
                case 7:
                    await db.User.update({ status: 'lock3' }, { where: { id: comment.userId }, transaction });
                    await emailService.emailNotiLockAccount({
                        email: user.email,
                        username: user.username,
                        time: SUSPENSION_DURATION.LOCK3,
                    });
                    break;
                case 10:
                    await db.User.update({ status: 'lock7' }, { where: { id: comment.userId }, transaction });
                    await emailService.emailNotiLockAccount({
                        email: user.email,
                        username: user.username,
                        time: SUSPENSION_DURATION.LOCK7,
                    });
                    break;
                case 15:
                    await db.User.update({ status: 'permanent' }, { where: { id: comment.userId }, transaction });
                    await emailService.emailNotiLockAccount({
                        email: user.email,
                        username: user.username,
                        time: SUSPENSION_DURATION.PERMANENT,
                    });
                    break;
                default:
                    break;
            }
        }
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

const createSongService = async ({ data, file, lyric, duration } = {}) => {
    const transaction = await db.sequelize.transaction();
    const songId = uuidv4();
    let filePathAudio = null;
    let filePathLyric = null;
    const updates = {};
    const uploadPromises = [];

    try {
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

        if (!file) throw new ApiError(StatusCodes.BAD_REQUEST, 'File required');
        if (file) {
            uploadPromises.push(() =>
                awsService.uploadSong(songId, file).then((filePathAudio) => {
                    updates.filePathAudio = filePathAudio;
                }),
            );
            updates.duration = duration;
        }
        if (lyric) {
            uploadPromises.push(() =>
                awsService.uploadSongLyric(songId, lyric).then((filePathLyric) => {
                    updates.lyric = filePathLyric;
                }),
            );
        }

        await Promise.all([
            db.Song.create(
                {
                    id: songId,
                    title: data.title,
                    filePathAudio: 'No file',
                },
                { transaction },
            ),
            db.ArtistSong.create(
                {
                    songId: songId,
                    artistId: data.mainArtistId,
                    main: true,
                },
                { transaction },
            ),
            data.subArtistIds.map((sub) => {
                return db.ArtistSong.create(
                    {
                        songId: songId,
                        artistId: sub.artistId,
                        main: false,
                    },
                    { transaction },
                );
            }),
        ]);
        await Promise.all(uploadPromises.map((fn) => fn()));
        await db.Song.update(updates, { where: { id: songId }, transaction });
        await transaction.commit();
    } catch (error) {
        await Promise.all([transaction.rollback(), awsService.deleteFolder(`PBL6/SONG/SONG_${songId}`)]);
        throw error;
    }
};

const createAlbum = async ({ data, file } = {}) => {
    const transaction = await db.sequelize.transaction();
    let albumCoverURL = null;
    let size = null;
    try {
        const albumId = uuidv4();

        // upload ảnh
        if (file) {
            albumCoverURL = await awsService.uploadAlbumCover(data.mainArtistId, albumId, file);
            size = (await sharp(file.buffer).metadata()).width;
        }

        // tạo album,
        await db.Album.create(
            {
                albumId: albumId,
                title: data.title,
                albumType: data.type,
                releaseDate: data.releaseDate,
            },
            { transaction },
        );

        // tạo album image
        await db.AlbumImage.create(
            {
                albumImageId: uuidv4(),
                albumId: albumId,
                image: albumCoverURL,
                size: size,
            },
            { transaction },
        );

        // tạo album song
        await Promise.all(
            data.songIds.map(async (s) => {
                await db.AlbumSong.create(
                    {
                        id: uuidv4(),
                        songId: s.songId,
                        albumId: albumId,
                    },
                    { transaction },
                );
            }),
        );

        await transaction.commit();
        return {
            size: size,
        };
    } catch (error) {
        await transaction.rollback();
        if (albumCoverURL) {
            await awsService.deleteFile(albumCoverURL);
        }
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
        // check album
        const checkAlbum = await db.Album.findByPk(albumId);
        if (!checkAlbum) throw new ApiError(StatusCodes.NOT_FOUND, 'Album not found');

        // update album
        const [[affectedCount, updatedRows], songsOfAlbum] = await Promise.all([
            db.Album.update(data, { where: { albumId: albumId }, returning: true }, { transaction }),
            db.AlbumSong.findAll({ where: { albumId: albumId }, attributes: ['songId'] }),
        ]);

        const songIdsOfAlbum = songsOfAlbum?.map((rec) => rec.songId);
        console.log('Songs of album: ', songIdsOfAlbum);

        const songIds = data.songIds ?? [];
        const songsAdd = songIds?.filter((id) => !songIdsOfAlbum.includes(id));
        const songsDel = songIdsOfAlbum?.filter((id) => !songIds.includes(id));

        // xóa bài hát ra khỏi album
        if (songsDel.length > 0)
            await db.AlbumSong.destroy({ where: { albumId: albumId, songId: { [Op.in]: songsDel } } }, { transaction });

        // thêm mới bài hát -> check song exits -> check cùng nghê sĩ chính
        if (songsAdd.length > 0) {
            const foundSongs = (
                await db.Song.findAll({ where: { id: { [Op.in]: songsAdd } }, attributes: ['id'] })
            ).map((s) => s.id);

            const invalidSongIds = songsAdd.filter((id) => !foundSongs.includes(id));
            if (invalidSongIds.length > 0) {
                throw new ApiError(StatusCodes.BAD_REQUEST, `Song IDs do not exist: ${invalidSongIds.join(', ')}`);
            }

            const checkArtist = await db.ArtistSong.findAll({
                where: { songId: { [Op.in]: songsAdd }, main: true },
                attributes: ['artistId'],
            });
            const checkArtistSet = new Set(checkArtist.map((s) => s.artistId));
            console.log('checkArtistSet: ', checkArtistSet);
            if (checkArtistSet.size > 1)
                throw new ApiError(StatusCodes.BAD_REQUEST, 'Album containing only songs by 1 main artist');

            if (songIdsOfAlbum.length !== 0) {
                const mainArtist = await db.Artist.findOne({
                    include: [
                        {
                            model: db.ArtistSong,
                            as: 'artistSong',
                            where: { songId: songIdsOfAlbum[0], main: true },
                            attributes: [],
                        },
                    ],
                    attributes: ['id'],
                    raw: true,
                });
                const check = checkArtistSet.has(mainArtist.id);
                if (!check) throw new ApiError(StatusCodes.BAD_REQUEST, 'Album containing only songs by 1 main artist');
            }

            const addPromises = songsAdd.map((songId) =>
                db.AlbumSong.create({ albumId: albumId, songId: songId }, { transaction }),
            );
            await Promise.all(addPromises);
        }

        if (file) {
            await awsService.copyFolder(`PBL6/ALBUM/${albumId}`, `PBL6/COPY/${albumId}`);
            await awsService.deleteFolder(`PBL6/ALBUM/${albumId}`);
            const [path, size] = await Promise.all([
                awsService.uploadAlbumCover('', albumId, file),
                (await sharp(file.buffer).metadata()).width,
            ]);
            await db.AlbumImage.update({ image: path, size: size }, { where: { albumId: albumId } });
        }
        await transaction.commit();
        await awsService.deleteFolder(`PBL6/COPY/${albumId}`);

        return {
            songsAdd: songsAdd,
            songsDel: songsDel,
        };
    } catch (error) {
        await transaction.rollback();
        if (file) {
            await awsService.copyFolder(`PBL6/COPY/${albumId}`, `PBL6/ALBUM/${albumId}`);
            await awsService.deleteFolder(`PBL6/COPY/${albumId}`);
        }
        throw error;
    }
};

const updateArtistService = async ({ artistId, data, file } = {}) => {
    const transaction = await db.sequelize.transaction();
    try {
        // check artist
        const checkArtist = await db.Artist.findByPk(artistId);
        if (!checkArtist) throw new ApiError(StatusCodes.NOT_FOUND, 'Artist not found');

        // update artist
        const [genresOfArtist] = await Promise.all([
            db.ArtistGenre.findAll({ where: { artistId: artistId }, attributes: ['genreId'], raw: true }),
            db.Artist.update(data, { where: { id: artistId }, returning: true }, { transaction }),
        ]);

        const genreIdsOfArtist = genresOfArtist?.map((rec) => rec.genreId);

        const genreIds = data.genres ?? [];
        const genresAdd = genreIds?.filter((id) => !genreIdsOfArtist.includes(id));
        const genresDel = genreIdsOfArtist?.filter((id) => !genreIds.includes(id));

        // xóa genre ra khỏi artist
        if (genresDel.length > 0)
            await db.ArtistGenre.destroy(
                { where: { artistId: artistId, genreId: { [Op.in]: genresDel } } },
                { transaction },
            );

        if (genresAdd.length > 0) {
            const foundGenres = (
                await db.Genre.findAll({ where: { genreId: { [Op.in]: genresAdd } }, attributes: ['genreId'] })
            ).map((s) => s.genreId);

            const invalidGenreIds = genresAdd.filter((id) => !foundGenres.includes(id));
            if (invalidGenreIds.length > 0) {
                throw new ApiError(StatusCodes.BAD_REQUEST, `Genre IDs do not exist: ${invalidGenreIds.join(', ')}`);
            }

            const addPromises = genresAdd.map((genreId) =>
                db.ArtistGenre.create({ artistId: artistId, genreId: genreId }, { transaction }),
            );
            await Promise.all(addPromises);
        }

        if (file) {
            await awsService.copyFolder(`PBL6/ARTIST/${artistId}`, `PBL6/COPY/ARTIST/${artistId}`);
            await awsService.deleteFolder(`PBL6/ARTIST/${artistId}`);
            const path = await awsService.uploadArtistAvatar(artistId, file);
            await db.Artist.update({ avatar: path }, { where: { id: artistId } });
        }

        await transaction.commit();
        await awsService.deleteFolder(`PBL6/COPY/ARTIST/${artistId}`);
        return {
            genresAdd: genresAdd,
            genresDel: genresDel,
        };
    } catch (error) {
        await transaction.rollback();
        if (file) {
            await awsService.copyFolder(`PBL6/COPY/ARTIST/${artistId}/`, `PBL6/ARTIST/${artistId}/`);
            await awsService.deleteFolder(`PBL6/COPY/ARTIST/${artistId}`);
        }
        throw error;
    }
};

const updateSongService = async ({ songId, data, duration, file, lyric } = {}) => {
    const transaction = await db.sequelize.transaction();
    const updates = {};
    const operations = {
        move: [],
        upload: [],
        delete: [],
        rollback: [],
    };
    const prefix = 'PBL6';

    try {
        const exPromises = [];
        const subArtistIds = data.subArtist ?? [];
        if (subArtistIds.includes(data.mainArtist)) throw new ApiError(StatusCodes.CONFLICT, 'Only 1 main artist');

        const song = await db.Song.findOne({ where: { id: songId, privacy: false } });
        if (!song) throw new ApiError(StatusCodes.NOT_FOUND, 'Song not found');
        if (data.title) updates.title = data.title;
        if (data.releaseDate) updates.releaseDate = data.releaseDate;
        if (data.mainArtist)
            exPromises.push(() =>
                db.ArtistSong.update(
                    { artistId: data.mainArtist },
                    { where: { songId: songId, main: true }, transaction },
                ),
            );
        if (file) {
            const oldFilePathAudio = song.filePathAudio ? prefix + song.filePathAudio.split(prefix)[1] : null;

            if (oldFilePathAudio) {
                const copyPath = `COPY/${oldFilePathAudio}`;
                operations.move.push(() => awsService.moveFile(oldFilePathAudio, copyPath));
                operations.rollback.push(() => awsService.moveFile(copyPath, oldFilePathAudio));
            }

            operations.upload.push(() =>
                awsService.uploadSong(song.id, file).then((filePathAudio) => {
                    updates.filePathAudio = filePathAudio;
                }),
            );

            updates.duration = duration;

            operations.delete.push(() => awsService.deleteFolder(`${prefix}/SONG/SONG_${songId}/audio`));
        }

        if (lyric) {
            const oldFilePathLyric = song.lyric ? prefix + song.lyric.split(prefix)[1] : null;

            if (oldFilePathLyric) {
                const copyPath = `COPY/${oldFilePathLyric}`;
                operations.move.push(() => awsService.moveFile(oldFilePathLyric, copyPath));
                operations.rollback.push(() => awsService.moveFile(copyPath, oldFilePathLyric));
            }

            operations.upload.push(() =>
                awsService.uploadSongLyric(song.id, lyric).then((filePathLyric) => {
                    updates.lyric = filePathLyric;
                }),
            );

            operations.delete.push(() => awsService.deleteFolder(`${prefix}/SONG/SONG_${songId}/lyric`));
        }

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

        // exPromises.push(() =>
        //     db.ArtistSong.destroy(
        //         { where: { songId: songId, artistId: { [Op.in]: subArtistDel } } },
        //         { transaction },
        //     ),
        // );

        if (subArtistAdd.length > 0) {
            const addPromises = subArtistAdd.map((artistId) =>
                db.ArtistSong.create({ artistId: artistId, songId: songId, main: false }, { transaction }),
            );
            await Promise.all(addPromises);
        }

        await Promise.all(operations.move.map((fn) => fn()));
        await Promise.all(operations.upload.map((fn) => fn()));
        exPromises.push(() => db.Song.update(updates, { where: { id: songId }, transaction }));
        await Promise.all(exPromises.map((fn) => fn()));

        await transaction.commit();
        await awsService.deleteFolder(`COPY/${prefix}/SONG/SONG_${songId}`);

        return {
            mainArtist: data.mainArtist,
            subArtistAdd: subArtistAdd,
            subArtistDel: subArtistDel,
        };
    } catch (error) {
        await transaction.rollback();
        await Promise.all(operations.delete.map((fn) => fn()));
        await Promise.all(operations.rollback.map((fn) => fn()));
        throw error;
    }
};

const updateGenreService = async ({ genreId, data } = {}) => {
    try {
        const checkGenre = await db.Genre.findByPk(genreId);
        if (!checkGenre) throw new ApiError(StatusCodes.NOT_FOUND, 'Genre not found');

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
        await Promise.all(albumIds.map((albumId) => awsService.deleteFolder(`PBL6/ALBUM/${albumId}`)));

        await Promise.all([
            db.AlbumSong.destroy({ where: { albumId: { [Op.in]: albumIds } } }, { transaction }),
            db.AlbumImage.destroy({ where: { albumId: { [Op.in]: albumIds } } }, { transaction }),
        ]);
        await db.Album.destroy({ where: { albumId: { [Op.in]: albumIds } } }, { transaction });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

const deleteArtistService = async ({ artistIds } = {}) => {
    const transaction = await db.sequelize.transaction();
    try {
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
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

const deleteSongService = async ({ songIds } = {}) => {
    const transaction = await db.sequelize.transaction();
    const prefix = 'PBL6';
    const operations = {
        move: [],
        rollback: [],
    };
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
        songs.map((song) => {
            const oldPathAudio = song.filePathAudio ? prefix + song.filePathAudio.split(prefix)[1] : null;
            const oldPathLyric = song.lyric ? prefix + song.lyric.split(prefix)[1] : null;
            console.log('ha: ', oldPathAudio, ' //// ', oldPathLyric);
            if (oldPathAudio) {
                operations.move.push(() => awsService.moveFile(oldPathAudio, `COPY_DELETE/${oldPathAudio}`));
                operations.rollback.push(() => awsService.moveFile(`COPY_DELETE/${oldPathAudio}`, oldPathAudio));
            }
            if (oldPathLyric) {
                operations.move.push(() => awsService.moveFile(oldPathLyric, `COPY_DELETE/${oldPathLyric}`));
                operations.rollback.push(() => awsService.moveFile(`COPY_DELETE/${oldPathLyric}`, oldPathLyric));
            }
        });
        await Promise.all(operations.move.map((fn) => fn()));
        await transaction.commit();
        await awsService.deleteFolder('COPY_DELETE');
    } catch (error) {
        console.log('loi');
        await transaction.rollback();
        await Promise.all(operations.rollback.map((fn) => fn()));
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
