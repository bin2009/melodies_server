import db from '~/models';
import bcrypt from 'bcryptjs';
import ApiError from '~/utils/ApiError';
import { slugify } from '~/utils/formatters';
import { playlistService } from './playlistService';
import { Op } from 'sequelize';
import { songService } from './songService';
import { v4 as uuidv4 } from 'uuid';
import { StatusCodes } from 'http-status-codes';
import { artistService } from './artistService';
import { awsService } from './awsService';
import formatTime from '~/utils/timeFormat';

const saltRounds = 10;

const createNew = async (data) => {
    try {
        const data2 = {
            ...data,
            slug: slugify(data.username),
        };
        return data2;
    } catch (error) {
        throw error;
    }
};

const fetchUser = async ({ conditions = {}, limit, offset, order = [['createdAt', 'DESC']], group = [] } = {}) => {
    const users = await db.User.findAll({
        attributes: [
            'id',
            'name',
            'username',
            'email',
            'image',
            'status',
            'createdAt',
            'accountType',
            [db.Sequelize.fn('COUNT', db.Sequelize.col('songs.historyId')), 'totalPlay'],
        ],
        include: [
            {
                model: db.SongPlayHistory,
                as: 'songs',
                attributes: [],
            },
        ],
        group: group,
        order: order,
        where: conditions,
        limit: limit,
        offset: offset,
        subQuery: false,
    });

    const formatters = users.map((u) => {
        const formatter = { ...u.toJSON() };
        formatter.createdAt = formatTime(formatter.createdAt);
        return formatter;
    });
    return formatters;
};

const fetchUserCount = async ({ conditions = {} } = {}) => {
    return await db.User.count({ where: conditions });
};

const calculateTotalPages = (totalItems, limit) => {
    return Math.ceil(totalItems / limit);
};

const getInfoUserService = async (user) => {
    try {
        // const findUser = await db.User.findByPk(user.id);
        const findUser = await db.User.findOne({
            where: { id: user.id },
            attributes: ['id', 'role', 'username', 'email', 'name', 'image', 'accountType', 'status2'],
        });
        if (!findUser) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
        const { status2, ...other } = findUser.toJSON();

        return {
            ...other,
            status: status2,
        };
    } catch (error) {
        throw error;
    }
};
const getPlaylistService = async ({ page = 1, user, limit = 7 } = {}) => {
    try {
        const offset = (page - 1) * limit;

        const [allPlaylist, totalPlaylist] = await Promise.all([
            playlistService.fetchAllPlaylist({
                conditions: { userId: user.id },
                limit: limit,
                offset: offset,
            }),
            playlistService.fetchPlaylistCount({ conditions: { userId: user.id } }),
        ]);

        // const playlistsWithSongs = await Promise.all(
        //     allPlaylist.map(async (playlist) => {
        //         const songId = await playlistService.fetchOneSongOnPlaylist({
        //             conditions: { playlistId: playlist.id },
        //         });
        //         const song =
        //             songId && (await songService.fetchSongs({ conditions: { id: songId.songId }, mode: 'findOne' }));

        //         return {
        //             playlistId: playlist.id,
        //             name: playlist.title || null,
        //             image: (song && song.album) || null,
        //             description: playlist.description || null,
        //             privacy: playlist.privacy,
        //             totalSong: playlist.totalSong ?? 0,
        //         };
        //     }),
        // );

        const result = allPlaylist.map((playlist) => {
            const { id, playlistImage, ...other } = playlist;
            return {
                playlistId: id,
                ...other,
                image: playlistImage,
            };
        });

        return {
            page: page,
            totalPage: calculateTotalPages(totalPlaylist, limit),
            playlists: result,
        };
    } catch (error) {
        throw error;
    }
};

const getPlaylistDetailService = async ({ playlistId, user } = {}) => {
    try {
        const [playlist, songIds, findUser] = await Promise.all([
            playlistService.fetchAllPlaylist({ mode: 'findOne', conditions: { id: playlistId } }),
            playlistService.fetchAllSongIdsFromPlaylist({ conditions: { playlistId: playlistId } }),
            db.User.findByPk(user.id),
        ]);
        const songs = await songService.fetchSongs({ conditions: { id: { [Op.in]: songIds.map((s) => s.songId) } } });

        const totalTime = songs.reduce((acc, song) => acc + parseInt(song.duration), 0);
        // const songInfo = songs.map((s) => {
        //     const { artists, ...other } = s.toJSON();
        //     return {
        //         ...other,
        //         artists:
        //             artists.map(({ ArtistSong, ...otherArtist }) => ({
        //                 ...otherArtist,
        //                 main: ArtistSong?.main || false,
        //             })) ?? [],
        //     };
        // });

        const result = {
            playlistId: playlist.id,
            name: playlist.title ?? null,
            createdAt: playlist.createdAt,
            userId: user.id,
            // username: user.username ?? null,
            username: findUser.username ?? null,
            // image: songs[0]?.album ?? null,
            image: playlist.playlistImage,
            description: playlist.description ?? null,
            totalTime: totalTime,
            totalSong: playlist.totalSong ?? 0,
            // songsOfPlaylist: songInfo ?? null,
        };

        return {
            playlist: result,
        };
    } catch (error) {
        throw error;
    }
};

const getSongOfPlaylistService = async ({ playlistId, user } = {}) => {
    try {
        const checkOwner = await playlistService.isPlaylistOwnedByUser({
            playlistId: playlistId,
            userId: user.id,
        });
        if (!checkOwner)
            throw new ApiError(StatusCodes.FORBIDDEN, 'You do not have permission to access this playlist.');
        const songIds = await playlistService.fetchAllSongIdsFromPlaylist({
            conditions: { playlistId: playlistId },
        });
        const songs = await songService.fetchSongs({ conditions: { id: { [Op.in]: songIds.map((s) => s.songId) } } });
        return songs;
    } catch (error) {
        throw error;
    }
};

const createPlaylistService = async ({ data, user } = {}) => {
    const transaction = await db.sequelize.transaction();
    try {
        const count = await playlistService.fetchPlaylistCount({ conditions: { userId: user.id } });
        const newPlaylist = await db.Playlist.create(
            {
                id: uuidv4(),
                userId: user.id,
                title: data.title ?? `New playlist #${parseInt(count + 1)}`,
                description: data.description ?? null,
                playlistImage: data.playlistImage ?? null,
                privacy: false,
            },
            { transaction },
        );

        if (data.songId) {
            await db.PlaylistSong.create(
                {
                    playlistSongId: uuidv4(),
                    playlistId: newPlaylist.id,
                    songId: data.songId,
                },
                { transaction },
            );
        }
        await transaction.commit();
        return { newPlaylist: newPlaylist };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

const addSongPlaylistService = async ({ data, user } = {}) => {
    try {
        const checkOwner = await playlistService.isPlaylistOwnedByUser({
            playlistId: data.playlistId,
            userId: user.id,
        });
        if (!checkOwner)
            throw new ApiError(StatusCodes.FORBIDDEN, 'You do not have permission to access this playlist.');

        const check = await playlistService.checkSongExistsInPlaylist({
            playlistId: data.playlistId,
            songId: data.songId,
        });
        if (check) throw new ApiError(StatusCodes.CONFLICT, 'The song is already in the playlist');

        await db.PlaylistSong.create({
            playlistSongId: uuidv4(),
            playlistId: data.playlistId,
            songId: data.songId,
        });
    } catch (error) {
        throw error;
    }
};

const updatePlaylistService = async ({ playlistId, updateData, user, file } = {}) => {
    try {
        // console.log('user: ', user);
        const checkOwner = await playlistService.isPlaylistOwnedByUser({
            playlistId: playlistId,
            userId: user.id,
        });
        if (!checkOwner)
            throw new ApiError(StatusCodes.FORBIDDEN, 'You do not have permission to access this playlist.');

        let playlistUrl = null;
        if (file) {
            playlistUrl = await awsService.uploadPlaylistAvatar(user.id, playlistId, file);
            updateData.playlistImage = playlistUrl;
        }
        const playlist = await playlistService.updatePlaylistService({ playlistId: playlistId, data: updateData });
        return playlist;
    } catch (error) {
        throw error;
    }
};

const deleteSongService = async ({ data, user } = {}) => {
    try {
        const checkOwner = await playlistService.isPlaylistOwnedByUser({
            playlistId: data.playlistId,
            userId: user.id,
        });
        if (!checkOwner)
            throw new ApiError(StatusCodes.FORBIDDEN, 'You do not have permission to access this playlist.');

        const check = await playlistService.checkSongExistsInPlaylist({
            playlistId: data.playlistId,
            songId: data.songId,
        });
        if (!check) throw new ApiError(StatusCodes.NOT_FOUND, 'The song does not exist in the playlist.');

        await playlistService.deleteSongFromPlaylistService({
            playlistId: data.playlistId,
            songId: data.songId,
            userId: user.id,
        });
    } catch (error) {
        throw error;
    }
};

const deletePlaylistService = async ({ playlistId, user } = {}) => {
    const transaction = await db.sequelize.transaction();
    try {
        const checkOwner = await playlistService.isPlaylistOwnedByUser({
            playlistId: playlistId,
            userId: user.id,
        });
        if (!checkOwner)
            throw new ApiError(StatusCodes.FORBIDDEN, 'You do not have permission to access this playlist.');
        await db.PlaylistSong.destroy({ where: { playlistId: playlistId } }, { transaction });

        await playlistService.deletePlaylistService({ playlistId: playlistId }, { transaction });
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

// ------------------------------------------
const playTimeService = async ({ data, user } = {}) => {
    try {
        const checkSong = await songService.checkSongExists(data.songId);
        if (!checkSong) throw new ApiError(StatusCodes.NOT_FOUND, 'Song not found');
        await songService.postPlaytimeService({ user: user, data: data });
    } catch (error) {
        throw error;
    }
};

const likedSongService = async ({ data, user } = {}) => {
    try {
        const checkSong = await songService.checkSongExists(data.songId);
        if (!checkSong) throw new ApiError(StatusCodes.NOT_FOUND, 'Song not found');
        const liked = await songService.postLikedSongService({ user: user, data: data });
        return liked;
    } catch (error) {
        throw error;
    }
};

const postFollowService = async ({ data, user } = {}) => {
    const follow = await db.Follow.findOne({
        where: { userId: user.id, artistId: data.artistId },
    });

    if (follow) {
        await db.Follow.destroy({ where: { followerId: follow.followerId } });
        return false;
    } else {
        await db.Follow.create({
            followerId: uuidv4(),
            userId: user.id,
            artistId: data.artistId,
        });
        return true;
    }
};

const followedArtistService = async ({ data, user } = {}) => {
    try {
        const checkArtist = await artistService.checkArtistExits(data.artistId);
        if (!checkArtist) throw new ApiError(StatusCodes.NOT_FOUND, 'Artist not found');

        const follow = await postFollowService({ data: data, user: user });
        return follow;
    } catch (error) {
        throw error;
    }
};

const commentService = async ({ data, user } = {}) => {
    try {
        const checkSong = await songService.checkSongExists(data.songId);
        if (!checkSong) throw new ApiError(StatusCodes.NOT_FOUND, 'Song not found');

        if (data.commentParentId) {
            const checkComment = await songService.checkCommentExists(data.commentParentId);
            if (!checkComment) throw new ApiError(StatusCodes.NOT_FOUND, 'Comment parent not found');
        }

        const comment = await db.Comment.create({
            id: uuidv4(),
            userId: user.id,
            songId: data.songId,
            content: data.content,
            commentParentId: data.commentParentId || null,
        });

        return comment;
    } catch (error) {
        throw error;
    }
};

const reportCommentService = async ({ data, user } = {}) => {
    try {
        const report = await db.Report.create({
            userId: user.id,
            commentId: data.commentId,
            content: data.content,
            status: false,
        });
        return report;
    } catch (error) {
        throw error;
    }
};

const getRecentUserService = async ({ page = 1, limit = 10 } = {}) => {
    try {
        const offset = (page - 1) * limit;
        const [totalUser, users] = await Promise.all([
            fetchUserCount(),
            fetchUser({ limit: limit, offset: offset, group: ['User.id'] }),
        ]);
        return {
            page: page,
            totalPage: Math.ceil(totalUser / limit),
            users: users,
        };
    } catch (error) {
        throw error;
    }
};

const registerService = async (data) => {
    const transaction = await db.sequelize.transaction();
    try {
        const hashPass = await bcrypt.hash(data.password, saltRounds);
        data.password = hashPass;
        data.role = 'User';
        data.statusPassword = false;
        data.accountType = 'Free';
        data.status = true;
        const newUser = await db.User.create(data, { transaction });
        await db.Playlist.create(
            {
                userId: newUser.id,
                title: 'Yêu thích',
                description: 'Các bài nhạc đã thích.',
            },
            { transaction },
        );
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
    }
};

const userUploadSongService = async ({ user, data } = {}) => {
    try {
        const currentUser = await db.User.findByPk(user.id);
        if (currentUser.accountType !== 'Premium')
            throw new ApiError(StatusCodes.FORBIDDEN, 'Please upgrade your account to perform this function.');

        // upload nhạc -> check max upload ->
        const playlist = await db.Playlist.findOne({ where: { title: 'Nhạc của tôi', userId: user.id } });
        // const package = await db.if(playlist.length);
    } catch (error) {
        throw error;
    }
};

const updateAccountType = async () => {
    const transaction = await db.sequelize.transaction();
    try {
        const currentDate = new Date().getTime();
        const expiredBills = await db.Subscriptions.findAll({
            where: {
                endDate: { [Op.lt]: currentDate },
                statusUse: true,
            },
            raw: true,
        });
        if (expiredBills.length > 0) {
            await Promise.all([
                db.User.update(
                    { accountType: 'Free' },
                    { where: { id: expiredBills.map((b) => b.userId) } },
                    { transaction },
                ),
                db.Subscriptions.update(
                    { statusUse: false },
                    { where: { id: { [Op.in]: expiredBills.map((b) => b.id) } } },
                    { transaction },
                ),
            ]);
            console.log(`Updated account types to Free for users: ${expiredBills.map((b) => b.userId)}`);
        } else {
            console.log('No expired accounts found.');
        }
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

export const userService = {
    // ---------------------
    fetchUser,
    fetchUserCount,
    createNew,
    getInfoUserService,
    getPlaylistService,
    getPlaylistDetailService,
    getSongOfPlaylistService,
    createPlaylistService,
    addSongPlaylistService,
    updatePlaylistService,
    deleteSongService,
    deletePlaylistService,
    // ---------------actions
    playTimeService,
    likedSongService,
    followedArtistService,
    commentService,
    reportCommentService,
    // ---------------------
    postFollowService,
    // -----------------
    getRecentUserService,

    // -----------------..
    registerService,
    userUploadSongService,
    // ---------------cron job
    updateAccountType,
};
