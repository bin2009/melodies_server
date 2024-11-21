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
            totalSongs: (await db.Song.count()) || 0,
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

        const song = await db.Song.findOne({
            where: { id: topSong.songId },
            include: [
                {
                    model: db.Album,
                    as: 'album',
                    through: { attributes: [] },
                    attributes: ['albumId', 'title', 'releaseDate', 'albumType'],
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
            album: album,
            artists: artists.map(({ ArtistSong, ...otherArtist }) => ({
                ...otherArtist,
                main: ArtistSong?.main || false,
            })),
            playCount: topSong.playCount,
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
            albumService.fetchAlbumIds({ order: [['createdAt', 'DESC']] }),
        ]);

        const result = await Promise.all(
            albums.map(async (album) => {
                const firstSongOfAlbum = await db.AlbumSong.findOne({
                    where: { albumId: album.albumId },
                    attributes: ['songId'],
                });
                const mainArtistId = await artistService.fetchMainArtist({
                    conditions: { songId: firstSongOfAlbum.songId, main: true },
                });

                const totalSong = await db.AlbumSong.count({ where: { albumId: album.albumId } });

                const mainArtist =
                    mainArtistId &&
                    (await artistService.fetchArtist({
                        mode: 'findOne',
                        conditions: { id: mainArtistId.artistId },
                    }));
                return {
                    ...album.toJSON(),
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
            const { status2, ...other } = user.toJSON();
            let statusMessage = '';
            switch (status2) {
                case 'normal':
                    statusMessage = 'normal';
                    break;
                case 'lock3':
                    statusMessage = 'block 3 days';
                    break;
                case 'lock7':
                    statusMessage = 'block 7 days';
                    break;
                case 'permanent':
                    statusMessage = 'permanently locked';
                    break;
                default:
                    statusMessage = 'unknown status';
                    break;
            }
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

const createSongService = async ({ data, file, duration } = {}) => {
    const transaction = await db.sequelize.transaction();
    let filePathAudio = null;
    const songId = uuidv4();

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

        if (file) {
            filePathAudio = await awsService.uploadSong(data.mainArtistId, songId, file);
        }

        // tạo song
        const newSong = await db.Song.create(
            {
                id: songId,
                title: data.title,
                duration: duration,
                // duration: 123,
                filePathAudio: filePathAudio,
                releaseDate: data.releaseDate,
            },
            { transaction },
        );

        // tạo artist song
        await Promise.all([
            db.ArtistSong.create(
                {
                    artistSongId: uuidv4(),
                    songId: songId,
                    artistId: data.mainArtistId,
                    main: true,
                },
                { transaction },
            ),
            data.subArtistIds.map((sub) => {
                return db.ArtistSong.create(
                    {
                        artistSongId: uuidv4(),
                        songId: songId,
                        artistId: sub.artistId,
                        main: false,
                    },
                    { transaction },
                );
            }),
        ]);
        await transaction.commit();
        return await songService.fetchSongs({ conditions: { id: newSong.id } });
    } catch (error) {
        await transaction.rollback();
        if (filePathAudio) {
            await awsService.deleteFile(filePathAudio);
        }
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
    // ------------create
    createSongService,
    createAlbum,
    createAdminService,
};
