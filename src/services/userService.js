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
import encodeData from '~/utils/encryption';
import { NOTIFICATIONS, PLAYLIST_TYPE } from '~/data/enum';
import { sendMessageToUser } from '~/sockets/socketManager';

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
            attributes: ['id', 'role', 'username', 'email', 'name', 'image', 'accountType', 'status'],
        });
        if (!findUser) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');

        return findUser;
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
        const { id, ...other } = newPlaylist.toJSON();
        const formatter = {
            playlistId: id,
            ...other,
        };
        return { newPlaylist: formatter };
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

const updateUserService = async ({ user, data, file } = {}) => {
    try {
        const findUser = await db.User.findByPk(user.id);
        if (!findUser) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');

        const validPass = await bcrypt.compare(data.oldPassword, findUser.password);
        if (!validPass) throw new ApiError(StatusCodes.UNAUTHORIZED, 'Old password is incorrect.');

        let imageFile;
        if (file) {
            imageFile = await awsService.userUploadImage(user.id, file);
        }

        const updateData = {};
        if (data.name) updateData.name = data.name;
        if (data.password) {
            const hashPass = await bcrypt.hash(data.password, saltRounds);
            updateData.password = hashPass;
        }
        if (imageFile && imageFile !== null) {
            updateData.image = imageFile;
        }
        await db.User.update(updateData, { where: { id: user.id } });
    } catch (error) {
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
    const transaction = await db.sequelize.transaction();
    try {
        const comment = await db.Comment.findByPk(data.commentId);
        if (!comment) throw new ApiError(StatusCodes.NOT_FOUND, 'Comment not found');

        const [report] = await Promise.all([
            db.Report.create(
                {
                    userId: user.id,
                    commentId: comment.id,
                    content: data.content,
                },
                { transaction },
            ),
        ]);
        await transaction.commit();
        return report;
    } catch (error) {
        await transaction.rollback();
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
        throw error;
    }
};

const userUploadSongService = async ({ user, title, file, duration, lyric, image } = {}) => {
    const transaction = await db.sequelize.transaction();
    let songId;
    try {
        const song = await db.Song.create(
            {
                userId: user.id,
                title: title,
                filePathAudio: 'No file',
                privacy: true,
                uploadUserId: user.id,
            },
            { transaction },
        );
        songId = song.id;
        const updates = {};
        const uploadPromises = [];

        if (file) {
            uploadPromises.push(() =>
                awsService.userUploadSong(user.id, songId, file).then((filePathAudio) => {
                    updates.filePathAudio = filePathAudio;
                }),
            );
            updates.duration = duration;
        }
        if (lyric) {
            uploadPromises.push(() =>
                awsService.userUploadSongLyric(user.id, songId, lyric).then((filePathLyric) => {
                    updates.lyric = filePathLyric;
                }),
            );
        }
        if (image) {
            uploadPromises.push(() =>
                awsService.userUploadSongImage(user.id, songId, image).then((filePathImage) => {
                    updates.image = filePathImage;
                }),
            );
        }
        await Promise.all(uploadPromises.map((fn) => fn()));
        await db.Song.update(updates, { where: { id: songId }, transaction });
        //  lấy ra playlist của user đó -> thêm nhạc vào
        const playlist = await db.Playlist.findOne({ where: { userId: user.id, title: PLAYLIST_TYPE.MYMUSIC } });
        await db.PlaylistSong.create(
            {
                playlistId: playlist.id,
                songId: songId,
            },
            { transaction },
        );
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        await awsService.deleteFolder(`PBL6/USER/USER_${user.id}/SONG_${songId}`);
        throw error;
    }
};

const getUserSongService = async (user, songId) => {
    try {
        const song = await db.Song.findByPk(songId);
        if (!song) throw new ApiError(StatusCodes.NOT_FOUND, 'Song not found');
        if (song.uploadUserId !== user.id)
            throw new ApiError(StatusCodes.FORBIDDEN, 'You do not have access to the song');

        const formatter = song.toJSON();
        formatter.createdAt = formatTime(formatter.createdAt);
        formatter.updatedAt = formatTime(formatter.updatedAt);
        if (formatter.filePathAudio) formatter.filePathAudio = encodeData(formatter.filePathAudio);
        if (formatter.lyric) formatter.lyric = encodeData(formatter.lyric);
        if (formatter.image) formatter.image = encodeData(formatter.image);

        return formatter;
    } catch (error) {
        throw error;
    }
};

// const updateUserSongService = async ({ user, songId, title, file, duration, lyric, image }) => {
//     const transaction = await db.sequelize.transaction();
//     const prefix = 'PBL6_MELODIES';
//     const updates = {};
//     // const copyPromises = [];
//     const updatePromises = [];
//     // -----
//     const deleteOldPromises = [];
//     const deletePromises = [];
//     const backPromises = [];
//     const movePromises = [];
//     try {
//         const song = await db.PersonalSong.findByPk(songId);
//         if (!song) throw new ApiError(StatusCodes.NOT_FOUND, 'Song not found');
//         if (song.userId !== user.id) throw new ApiError(StatusCodes.FORBIDDEN, 'You do not have access to the song');

//         if (file) {
//             if (song.filePathAudio) {
//                 const oldFilePathAudio = prefix + song.filePathAudio.split(prefix)[1];
//                 console.log('old: ', oldFilePathAudio);
//                 movePromises.push(() => awsService.moveFile(oldFilePathAudio, `COPY/${oldFilePathAudio}`));

//                 updatePromises.push(() =>
//                     awsService.userUploadSong(user.id, song.id, file).then((filePathAudio) => {
//                         updates.filePathAudio = filePathAudio;
//                     }),
//                 );
//                 updates.duration = duration;
//                 console.log('update: ', updates);
//                 backPromises.push(() => awsService.moveFile(`COPY/${oldFilePathAudio}`, oldFilePathAudio));
//                 deletePromises.push(() => awsService.deleteFile(prefix + updates.filePathAudio.split(prefix)[1]));
//             } else {
//                 // updatePromises.push(
//                 //     awsService.userUploadSong(user.id, song.id, file).then((filePathAudio) => {
//                 //         updates.filePathAudio = filePathAudio;
//                 //     }),
//                 // );
//                 // updates.duration = duration;
//                 // deletePromises.push(awsService.deleteFile(updates.filePathAudio));
//             }
//         }
//         if (title) {
//             updates.title = title;
//         }
//         await Promise.all(movePromises.map((promiseFunc) => promiseFunc()));
//         await Promise.all(updatePromises.map((promiseFunc) => promiseFunc()));
//         await awsService.deleteFolder(`COPY/PBL6_MELODIES/USER_${user.id}/SONG_${songId}`);
//         await db.PersonalSong.update(updates, { where: { id: songId }, transaction });
//         await transaction.commit();
//         return true;

//         // const newSong = await db.PersonalSong.findByPk(songId);
//         // const formatter = newSong.toJSON();
//         // formatter.createdAt = formatTime(formatter.createdAt);
//         // formatter.updatedAt = formatTime(formatter.updatedAt);
//         // formatter.filePathAudio = encodeData(formatter.filePathAudio);
//         // formatter.lyric = encodeData(formatter.lyric);
//         // formatter.image = encodeData(formatter.image);
//         // return formatter;
//     } catch (error) {
//         console.log('chạy lỗi', updates);
//         await transaction.rollback();
//         // await Promise.all([...deletePromises, ...backPromises]);
//         await Promise.all(deletePromises.map((promiseFunc) => promiseFunc()));
//         await Promise.all(backPromises.map((promiseFunc) => promiseFunc()));
//         throw error;
//     }
// };

const updateUserSongService = async ({ user, songId, title, file, duration, lyric, image }) => {
    const transaction = await db.sequelize.transaction();
    const prefix = 'PBL6';
    const updates = {};
    const operations = {
        move: [],
        upload: [],
        delete: [],
        rollback: [],
    };

    try {
        const song = await db.Song.findByPk(songId);
        if (!song) throw new ApiError(StatusCodes.NOT_FOUND, 'Song not found');
        if (song.uploadUserId !== user.id)
            throw new ApiError(StatusCodes.FORBIDDEN, 'You do not have access to the song');

        if (file) {
            const oldFilePathAudio = song.filePathAudio ? prefix + song.filePathAudio.split(prefix)[1] : null;

            if (oldFilePathAudio) {
                const copyPath = `COPY/${oldFilePathAudio}`;
                operations.move.push(() => awsService.moveFile(oldFilePathAudio, copyPath));
                operations.rollback.push(() => awsService.moveFile(copyPath, oldFilePathAudio));
            }

            operations.upload.push(() =>
                awsService.userUploadSong(user.id, song.id, file).then((filePathAudio) => {
                    updates.filePathAudio = filePathAudio;
                }),
            );

            updates.duration = duration;

            operations.delete.push(() =>
                awsService.deleteFolder(`${prefix}/USER/USER_${user.id}/SONG_${songId}/audio`),
            );
        }

        if (lyric) {
            const oldFilePathLyric = song.lyric ? prefix + song.lyric.split(prefix)[1] : null;

            if (oldFilePathLyric) {
                const copyPath = `COPY/${oldFilePathLyric}`;
                operations.move.push(() => awsService.moveFile(oldFilePathLyric, copyPath));
                operations.rollback.push(() => awsService.moveFile(copyPath, oldFilePathLyric));
            }

            operations.upload.push(() =>
                awsService.userUploadSongLyric(user.id, song.id, lyric).then((filePathLyric) => {
                    updates.lyric = filePathLyric;
                }),
            );

            operations.delete.push(() =>
                awsService.deleteFolder(`${prefix}/USER/USER_${user.id}/SONG_${songId}/lyric`),
            );
        }

        if (image) {
            const oldFilePathImage = song.image ? prefix + song.image.split(prefix)[1] : null;

            if (oldFilePathImage) {
                const copyPath = `COPY/${oldFilePathImage}`;
                operations.move.push(() => awsService.moveFile(oldFilePathImage, copyPath));
                operations.rollback.push(() => awsService.moveFile(copyPath, oldFilePathImage));
            }

            operations.upload.push(() =>
                awsService.userUploadSongImage(user.id, song.id, image).then((filePathImage) => {
                    updates.image = filePathImage;
                }),
            );

            operations.delete.push(() =>
                awsService.deleteFolder(`${prefix}/USER/USER_${user.id}/SONG_${songId}/image`),
            );
        }

        if (title) updates.title = title;

        await Promise.all(operations.move.map((fn) => fn()));
        await Promise.all(operations.upload.map((fn) => fn()));

        await db.Song.update(updates, { where: { id: song.id }, transaction });

        await awsService.deleteFolder(`COPY/${prefix}/USER/USER_${user.id}/SONG_${songId}`);
        await transaction.commit();
        const newSong = await db.Song.findByPk(songId);
        const formatter = newSong.toJSON();
        if (formatter.filePathAudio) formatter.filePathAudio = encodeData(formatter.filePathAudio);
        if (formatter.lyric) formatter.lyric = encodeData(formatter.lyric);
        if (formatter.image) formatter.image = encodeData(formatter.image);
        formatter.createdAt = formatTime(formatter.createdAt);
        formatter.updatedAt = formatTime(formatter.updatedAt);
        return formatter;
    } catch (error) {
        await transaction.rollback();

        await Promise.all(operations.delete.map((fn) => fn()));
        await Promise.all(operations.rollback.map((fn) => fn()));

        throw error;
    }
};

const deleteUserSongService = async ({ user, songId } = {}) => {
    const transaction = await db.sequelize.transaction();
    try {
        const song = await db.Song.findByPk(songId);
        if (!song) throw new ApiError(StatusCodes.NOT_FOUND, 'Song not found');
        if (song.uploadUserId !== user.id)
            throw new ApiError(StatusCodes.FORBIDDEN, 'You do not have access to the song');

        const playlist = await db.Playlist.findOne({ where: { userId: user.id, title: PLAYLIST_TYPE.MYMUSIC } });
        await db.PlaylistSong.destroy({ where: { playlistId: playlist.id, songId: song.id }, transaction });
        await db.Song.destroy({ where: { id: song.id }, transaction });
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

const getAllNotificationsService = async ({ user, page = 1, limit = 10 } = {}) => {
    try {
        const offset = (page - 1) * limit;
        const count = await db.Notifications.count({ where: { userId: user.id, isRead: false } });
        const notifications = await db.Notifications.findAll({
            order: [
                ['isRead', 'ASC'],
                ['createdAt', 'DESC'],
            ],
            limit: limit,
            offset: offset,
        });
        const formatters = notifications.map((r) => {
            const formatter = { ...r.toJSON() };
            formatter.createdAt = formatTime(formatter.createdAt);
            formatter.updatedAt = formatTime(formatter.updatedAt);
            return formatter;
        });
        return {
            notificationsNumber: count,
            notifications: formatters,
        };
        // return formatters;
    } catch (error) {
        throw error;
    }
};

const getNotiDetailService = async (user, id) => {
    try {
        const noti = await db.Notifications.findByPk(id);
        if (!noti) throw new ApiError(StatusCodes.NOT_FOUND, 'Notification not found');
        if (noti.userId !== user.id)
            throw new ApiError(StatusCodes.FORBIDDEN, 'You do not have permission to perform this function.');

        if (noti.type === 'SYSTEM') {
            // thông báo cảnh cáo
            // lấy ra các bình luận bị ẩn gần nhất của họ
            const comments = await db.Comment.findAll({
                where: { userId: user.id, hide: true },
                order: [['updatedAt', 'desc']],
                limit: 3,
            });

            const formatters = comments.map((c) => {
                const formatter = c.toJSON();
                formatter.createdAt = formatTime(formatter.createdAt);
                formatter.updatedAt = formatTime(formatter.updatedAt);
                return formatter;
            });
            return {
                type: 'SYSTEM',
                result: formatters,
            };
        }
        if (noti.type === 'COMMENT') {
            const report = await db.Report.findOne({
                where: { id: noti.from },
                attributes: ['id', 'content', 'userId', 'status', 'createdAt'],
                include: [
                    {
                        model: db.Comment,
                        as: 'comment',
                        attributes: ['id', 'content', 'hide', 'createdAt'],
                        include: [
                            { model: db.User, as: 'user', attributes: ['id', 'image', 'username', 'name', 'email'] },
                        ],
                    },
                ],
            });
            const formatter = report.toJSON();
            formatter.createdAt = formatTime(formatter.createdAt);
            formatter.comment.createdAt = formatTime(formatter.comment.createdAt);
            const comment = await db.Comment.findByPk(report.commentId);

            // 1. User chính là người report, reject
            if (report.userId === user.id) {
                return {
                    type: 'COMMENT',
                    result: formatter,
                };
            } else {
                return {
                    type: 'COMMENT',
                    result: formatter.comment,
                };
            }
        }
        if (noti.type === 'PAYMENT') {
            const payment = await db.Subscriptions.findOne({
                where: { id: noti.from },
                include: [
                    {
                        model: db.User,
                        as: 'user',
                        attributes: ['id', 'username', 'name', 'email', 'image', 'accountType'],
                    },
                    {
                        model: db.SubscriptionPackage,
                        as: 'package',
                        attributes: { exclude: ['createdAt', 'updatedAt'] },
                    },
                ],
            });

            const formatter = payment.toJSON();
            formatter.startDate = formatTime(formatter.startDate);
            formatter.endDate = formatTime(formatter.endDate);
            formatter.createdAt = formatTime(formatter.createdAt);
            formatter.updatedAt = formatTime(formatter.updatedAt);
            return {
                type: 'PAYMENT',
                result: formatter,
            };
        }
        if (noti.type === 'PACKAGE') {
            const findPackage = await db.SubscriptionPackage.findOne({
                where: { id: noti.from },
            });
            const formatter = findPackage.toJSON();
            formatter.createdAt = formatTime(formatter.createdAt);
            formatter.updatedAt = formatTime(formatter.updatedAt);
            return {
                type: 'PACKAGE',
                result: formatter,
            };
        }
    } catch (error) {
        throw error;
    }
};

const getReportDetailService = async ({ user, reportId } = {}) => {
    try {
        const report = await db.Report.findByPk(reportId);
        if (!report) throw new ApiError(StatusCodes.NOT_FOUND, 'Report not found');
        if (!(user.role === 'Admin' || report.userId === user.id))
            throw new ApiError(StatusCodes.FORBIDDEN, 'You do not have access');

        const reportDetail = await db.Report.findOne({
            where: { id: reportId },
            attributes: ['id', 'content', 'status', 'createdAt'],
            include: [
                {
                    model: db.User,
                    as: 'user',
                    attributes: ['id', 'username', 'name', 'email', 'image', 'accountType', 'status', 'createdAt'],
                },
                {
                    model: db.Comment,
                    as: 'comment',
                },
            ],
        });

        const formatter = reportDetail.toJSON();
        const [song, userComment] = await Promise.all([
            songService.fetchSongs({ conditions: { id: formatter.comment.songId }, mode: 'findOne' }),
            db.User.findOne({
                where: { id: formatter.comment.userId },
                attributes: ['id', 'username', 'name', 'email', 'image', 'accountType', 'status', 'createdAt'],
            }),
        ]);
        formatter.comment.song = song;
        formatter.comment.userComment = userComment.toJSON();
        delete formatter.comment.userId;
        delete formatter.comment.songId;

        formatter.createdAt = formatTime(formatter.createdAt);
        formatter.user.createdAt = formatTime(formatter.user.createdAt);
        formatter.comment.createdAt = formatTime(formatter.comment.createdAt);
        formatter.comment.updatedAt = formatTime(formatter.comment.updatedAt);
        formatter.comment.userComment.createdAt = formatTime(formatter.comment.userComment.createdAt);

        return formatter;
    } catch (error) {
        throw error;
    }
};

const downloadSongService = async ({ user, songId } = {}) => {
    try {
        const song = await db.Song.findOne({ where: { id: songId, privacy: false } });
        if (!song) throw new ApiError(StatusCodes.NOT_FOUND, 'Song not found');

        await db.Download.create({ userId: user.id, songId: songId });
    } catch (error) {
        throw error;
    }
};

// --------------------------cron job

const updateAccountType = async () => {
    const transaction = await db.sequelize.transaction();
    try {
        const currentDate = new Date().getTime();
        const twoDaysLater = new Date();
        twoDaysLater.setDate(currentDate.getDate() + 2);
        const expiredBills = await db.Subscriptions.findAll({
            where: {
                endDate: { [Op.lt]: currentDate },
                statusUse: true,
            },
            raw: true,
        });
        const expiringSoonBills = await db.Subscriptions.findAll({
            where: {
                endDate: {
                    [Op.between]: [currentDate, twoDaysLater],
                },
                statusUse: true,
            },
            raw: true,
        });
        let expiredNotis = [];
        let expiringsoonNotis = [];
        if (expiredBills.length > 0) {
            const notifications = expiredBills.map((b) => ({
                userId: b.userId,
                message: 'Your premium subscription has expired. Please renew to continue enjoying premium features.',
                type: 'PACKAGE',
                from: b.packageId,
            }));

            (expiredNotis = await db.Notifications.bulkCreate(notifications, { transaction })),
                await Promise.all([
                    db.User.update(
                        { accountType: 'FREE' },
                        { where: { id: expiredBills.map((b) => b.userId) }, transaction },
                    ),
                    db.Subscriptions.update(
                        { statusUse: false },
                        { where: { id: { [Op.in]: expiredBills.map((b) => b.id) } }, transaction },
                    ),
                ]);
            console.log(`Updated account types to Free for users: ${expiredBills.map((b) => b.userId)}`);
        } else {
            console.log('No expired accounts found.');
        }

        if (expiringSoonBills.length > 0) {
            const notifications = expiringSoonBills.map((b) => ({
                userId: b.userId,
                message:
                    'Your premium package will expire in 2 days, please stay tuned for upgrade to avoid interruption.',
                type: 'PACKAGE',
                from: b.packageId,
            }));

            expiringsoonNotis = await db.Notifications.bulkCreate(notifications, { transaction });
        }
        await transaction.commit();

        // expiredBills.map((b) => {
        //     sendMessageToUser(b.userId, 'newNoti', '');
        // });
        // expiringSoonBills.map((b) => {
        //     sendMessageToUser(b.userId, 'newNoti', '');
        // });
        expiredNotis.map((n) => {
            sendMessageToUser(n.userId, 'newNoti', n);
        });
        expiringsoonNotis.map((n) => {
            sendMessageToUser(n.userId, 'newNoti', n);
        });
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
    updateUserService,
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
    getUserSongService,
    updateUserSongService,
    deleteUserSongService,
    getAllNotificationsService,
    getNotiDetailService,
    getReportDetailService,
    downloadSongService,
    // ---------------cron job
    updateAccountType,
};
