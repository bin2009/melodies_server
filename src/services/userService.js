import db from '~/models';
import bcrypt from 'bcryptjs';
import ApiError from '~/utils/ApiError';
import { playlistService } from './playlistService';
import { Op } from 'sequelize';
import { songService } from './songService';
import { v4 as uuidv4 } from 'uuid';
import { StatusCodes } from 'http-status-codes';
import { artistService } from './artistService';
import { awsService } from './awsService';
import formatTime from '~/utils/timeFormat';
import encodeData from '~/utils/encryption';
import { PLAYLIST_TYPE } from '~/data/enum';
import { appMiddleWare } from '~/middleware/appMiddleWare';
import { sendMessageToUser } from '~/sockets/socketManager';

const saltRounds = 10;

const fetchUser = async ({ conditions = {}, limit, offset, order = [['updatedAt', 'DESC']], group = [] } = {}) => {
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
        if (formatter.image && formatter.image.includes('PBL6')) {
            formatter.image = `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_ENDPOINT}/${formatter.image}`;
        }
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

const getInfoUserService2 = async (user) => {
    try {
        const findUser = await db.User.findOne({
            where: { id: user.id },
            attributes: ['id', 'role', 'username', 'email', 'name', 'image', 'accountType', 'status'],
            include: [
                {
                    model: db.SubscriptionPackage,
                    as: 'package',
                    attributes: { exclude: ['createdAt', 'updatedAt'] },
                    through: {
                        attributes: ['id', 'startDate', 'endDate', 'status', 'statusUse'],
                    },
                },
            ],
        });
        if (!findUser) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');

        const { image, ...other } = findUser.toJSON();

        return {
            ...other,
            image:
                image && image.includes('PBL6')
                    ? `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_ENDPOINT}/${image}`
                    : null,
        };
    } catch (error) {
        throw error;
    }
};

const getInfoUserService = async (user) => {
    try {
        // const findUser = await db.User.findOne({
        //     where: { id: user.id },
        //     attributes: ['id', 'role', 'username', 'email', 'name', 'image', 'accountType', 'status'],
        //     include: [
        //         {
        //             model: db.SubscriptionPackage,
        //             as: 'package',
        //             attributes: { exclude: ['createdAt', 'updatedAt'] },
        //             through: {
        //                 attributes: ['id', 'startDate', 'endDate', 'status', 'statusUse'],
        //             },
        //         },
        //     ],
        // });

        const [findUser, packageId] = await Promise.all([
            db.User.findOne({
                where: { id: user.id },
                attributes: ['id', 'role', 'username', 'email', 'name', 'image', 'accountType', 'status'],
            }),
            db.Subscriptions.findOne({
                where: { userId: user.id, statusUse: true },
            }),
        ]);

        if (!findUser) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
        const { image, ...other } = findUser.toJSON();

        const result = {
            ...other,
            image:
                image && image.includes('PBL6')
                    ? `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_ENDPOINT}/${image}`
                    : null,
        };

        if (packageId) {
            const findPackage = await db.SubscriptionPackage.findByPk(packageId.packageId);
            const formatter = findPackage.toJSON();

            formatter.createdAt = formatTime(formatter.createdAt);
            formatter.updatedAt = formatTime(formatter.updatedAt);

            const formatterSub = packageId.toJSON();
            formatterSub.createdAt = formatTime(formatterSub.createdAt);
            formatterSub.updatedAt = formatTime(formatterSub.updatedAt);
            formatterSub.startDate = formatTime(formatterSub.startDate);
            formatterSub.endDate = formatTime(formatterSub.endDate);

            result.package = {
                ...formatter,
                Subscriptions: {
                    ...formatterSub,
                },
            };
        }

        return result;
        return {
            ...other,
            image:
                image && image.includes('PBL6')
                    ? `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_ENDPOINT}/${image}`
                    : null,
            package: {
                ...formatter,
                Subscriptions: {
                    ...formatterSub,
                },
            },
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

        const result = {
            playlistId: playlist.id,
            name: playlist.title ?? null,
            privacy: playlist.privacy,
            createdAt: playlist.createdAt,
            userId: user.id,
            username: findUser.username ?? null,
            image: playlist.playlistImage ?? null,
            description: playlist.description ?? null,
            totalTime: totalTime ?? 0,
            totalSong: playlist.totalSong ?? 0,
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
    const transaction = await db.sequelize.transaction();
    try {
        const updates = {};

        const playlist = await db.Playlist.findByPk(playlistId);
        if (!playlist) throw new ApiError(StatusCodes.NOT_FOUND, 'Playlist not found');

        if (playlist.privacy) throw new ApiError(StatusCodes.FORBIDDEN, 'You cannot update this playlist');

        if (playlist.userId !== user.id)
            throw new ApiError(StatusCodes.FORBIDDEN, 'You do not have permission to access this playlist.');

        if (file.playlistAvatar && file.playlistAvatar.length > 0) {
            updates.playlistImage = file.playlistAvatar[0].key;
        }

        if (updateData.title) {
            updates.title = updateData.title;
        }

        if (updateData.description) {
            updates.description = updateData.description;
        }

        const updatePlaylist = await db.Playlist.update(updates, { where: { id: playlistId }, transaction });
        const { id, ...other } = updatePlaylist;

        await transaction.commit();

        if (
            file.playlistAvatar &&
            file.playlistAvatar.length > 0 &&
            playlist.playlistImage &&
            playlist.playlistImage.includes('PBL6')
        ) {
            setImmediate(() => awsService.deleteFile3(playlist.playlistImage));
        }

        return {
            playlistId: id,
            ...other,
        };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

const deleteSongService = async ({ data, user } = {}) => {
    const transaction = await db.sequelize.transaction();
    try {
        const findPlaylist = await db.Playlist.findByPk(data.playlistId);
        if (!findPlaylist) throw new ApiError(StatusCodes.NOT_FOUND, 'Playlist not found');

        const findSong = await db.Song.findByPk(data.songId);
        if (!findSong) throw new ApiError(StatusCodes.NOT_FOUND, 'Song not found');

        if (findPlaylist.userId !== user.id)
            throw new ApiError(StatusCodes.FORBIDDEN, 'You do not have permission to access this playlist.');

        const checkSongExistsInPlaylist = await db.PlaylistSong.findOne({
            where: { playlistId: data.playlistId, songId: data.songId },
        });
        if (!checkSongExistsInPlaylist)
            throw new ApiError(StatusCodes.NOT_FOUND, 'The song does not exist in the playlist.');

        if (findSong.privacy && findSong.uploadUserId === user.id && findPlaylist.title === PLAYLIST_TYPE.MYMUSIC) {
            await db.PlaylistSong.destroy({ where: { playlistId: data.playlistId, songId: data.songId }, transaction });
            await db.Song.destroy({ where: { id: data.songId }, transaction });

            await transaction.commit();

            if (findSong.filePathAudio && findSong.filePathAudio.includes('PBL6'))
                setImmediate(() => awsService.deleteFile3(findSong.filePathAudio));
            if (findSong.image && findSong.image.includes('PBL6'))
                setImmediate(() => awsService.deleteFile3(findSong.image));
            if (findSong.lyric && findSong.lyric.includes('PBL6'))
                setImmediate(() => awsService.deleteFile3(findSong.lyric));
        } else {
            await db.PlaylistSong.destroy({
                where: { playlistId: data.playlistId, songId: data.songId },
                transaction,
            });
            await transaction.commit();
        }
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

const deletePlaylistService = async ({ playlistId, user } = {}) => {
    const transaction = await db.sequelize.transaction();
    try {
        const findPlaylist = await db.Playlist.findByPk(playlistId);
        if (!findPlaylist) throw new ApiError(StatusCodes.NOT_FOUND, 'Playlist not found');

        if (findPlaylist.userId !== user.id)
            throw new ApiError(StatusCodes.FORBIDDEN, 'You do not have permission to access this playlist.');

        if (
            findPlaylist.privacy &&
            (findPlaylist.title === PLAYLIST_TYPE.MYMUSIC || findPlaylist.title === PLAYLIST_TYPE.FAVOURITE)
        )
            throw new ApiError(StatusCodes.FORBIDDEN, 'You cannot delete this playlist');

        await db.PlaylistSong.destroy({ where: { playlistId: playlistId } }, { transaction });
        await db.Playlist.destroy({ where: { id: playlistId } }, { transaction });

        await transaction.commit();

        if (findPlaylist.playlistImage && findPlaylist.playlistImage.includes('PBL6')) {
            setImmediate(() => awsService.deleteFile3(findPlaylist.playlistImage));
        }
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

const updateUserService = async ({ user, data, file } = {}) => {
    const transaction = await db.sequelize.transaction();
    try {
        const updates = {};

        const findUser = await db.User.findByPk(user.id);
        if (!findUser) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');

        // if (data.)

        if (data.username) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'You are not allowed change username');
            // const checkUsername = await db.User.findOne({ where: { username: data.username } });
            // if (checkUsername && checkUsername.id !== user.id)
            //     throw new ApiError(StatusCodes.CONFLICT, 'Username already exists');
        }

        if (data.name) {
            updates.name = data.name;
        }

        if (file.image && file.image.length > 0) {
            updates.image = file.image[0].key;
        }

        await db.User.update(updates, { where: { id: user.id }, transaction });
        await transaction.commit();

        if (file.image && file.image.length > 0 && findUser.image && findUser.image.includes('PBL6')) {
            setImmediate(() => awsService.deleteFile3(findUser.image));
        }
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

const changePasswordService = async ({ user, data } = {}) => {
    try {
        if (!data.oldPassword) throw new ApiError(StatusCodes.BAD_REQUEST, 'Old password is required');

        if (!data.newPassword) throw new ApiError(StatusCodes.BAD_REQUEST, 'New password is required');

        const findUser = await db.User.findByPk(user.id);
        if (!findUser) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');

        const checkPassword = await bcrypt.compare(data.oldPassword, findUser.password);
        if (!checkPassword) throw new ApiError(StatusCodes.UNAUTHORIZED, 'Old password is incorrect');

        const hashPass = await bcrypt.hash(data.newPassword, saltRounds);
        await db.User.update({ password: hashPass }, { where: { id: user.id } });
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

        const result = report.toJSON();
        result.createdAt = formatTime(result.createdAt);
        result.updatedAt = formatTime(result.updatedAt);

        return result;
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
            fetchUser({
                limit: limit,
                offset: offset,
                group: ['User.id'],
                order: [
                    ['createdAt', 'DESC'],
                    ['username', 'ASC'],
                ],
                conditions: { role: 'User' },
            }),
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

// -----------------pernonal song

const userUploadSongService = async ({ user, title, releaseDate, files } = {}) => {
    const transaction = await db.sequelize.transaction();
    try {
        console.log('files: ', files);
        const dataCreateSong = {
            id: uuidv4(),
            userId: user.id,
            title: title,
            duration: 0,
            privacy: true,
            uploadUserId: user.id,
        };

        if (releaseDate) dataCreateSong.releaseDate = releaseDate;

        if (files.audioFile && files.audioFile.length > 0) {
            dataCreateSong.filePathAudio = files.audioFile[0].key;
            const duration = await appMiddleWare.getAudioDuration(files.audioFile[0].key);
            dataCreateSong.duration = duration ? parseInt(duration * 1000) : 0;
        }

        if (files.imageFile && files.imageFile.length > 0) dataCreateSong.image = files.imageFile[0].key;

        if (files.lyricFile && files.lyricFile.length > 0) dataCreateSong.lyric = files.lyricFile[0].key;

        const playlist = await db.Playlist.findOne({ where: { userId: user.id, title: PLAYLIST_TYPE.MYMUSIC } });

        await Promise.all([
            db.Song.create(dataCreateSong, { transaction }),
            db.PlaylistSong.create(
                {
                    playlistId: playlist.id,
                    songId: dataCreateSong.id,
                },
                { transaction },
            ),
        ]);

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();

        if (files.audioFile && files.audioFile.length > 0)
            setImmediate(() => awsService.deleteFile3(files.audioFile[0].key));

        if (files.imageFile && files.imageFile.length > 0)
            setImmediate(() => awsService.deleteFile3(files.imageFile[0].key));

        if (files.lyricFile && files.lyricFile.length > 0)
            setImmediate(() => awsService.deleteFile3(files.lyricFile[0].key));

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
        formatter.releaseDate = formatTime(formatter.releaseDate);
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

const updateUserSongService = async ({ user, songId, title, releaseDate, files }) => {
    const transaction = await db.sequelize.transaction();
    try {
        const updates = {};
        const song = await db.Song.findByPk(songId);
        if (!song) throw new ApiError(StatusCodes.NOT_FOUND, 'Song not found');
        if (song.uploadUserId !== user.id)
            throw new ApiError(StatusCodes.FORBIDDEN, 'You do not have access to the song');

        if (title) updates.title = title;

        if (releaseDate) updates.releaseDate = releaseDate;

        if (files.audioFile && files.audioFile.length > 0) updates.filePathAudio = files.audioFile[0].key;

        if (files.imageFile && files.imageFile.length > 0) updates.image = files.imageFile[0].key;

        if (files.lyricFile && files.lyricFile.length > 0) updates.lyric = files.lyricFile[0].key;

        await db.Song.update(updates, { where: { id: song.id }, transaction });

        await transaction.commit();

        const newSong = await db.Song.findOne({
            where: { id: songId },
            attributes: ['id', 'title', 'filePathAudio', 'lyric', 'image', 'releaseDate', 'createdAt', 'updatedAt'],
        });

        const formatter = newSong.toJSON();
        if (formatter.filePathAudio) formatter.filePathAudio = encodeData(formatter.filePathAudio);
        if (formatter.lyric) {
            console.log('có file lyric');
            formatter.lyric = encodeData(formatter.lyric);
        }
        if (formatter.image) formatter.image = encodeData(formatter.image);
        formatter.releaseDate = formatTime(formatter.releaseDate);
        formatter.createdAt = formatTime(formatter.createdAt);
        formatter.updatedAt = formatTime(formatter.updatedAt);

        if (files.audioFile && files.audioFile.length > 0 && song.filePathAudio)
            setImmediate(() => awsService.deleteFile3(song.filePathAudio));
        if (files.imageFile && files.imageFile.length > 0 && song.image)
            setImmediate(() => awsService.deleteFile3(song.image));
        if (files.lyricFile && files.lyricFile.length > 0 && song.lyric)
            setImmediate(() => awsService.deleteFile3(song.lyric));

        return formatter;
    } catch (error) {
        await transaction.rollback();

        if (files.audioFile && files.audioFile.length > 0)
            setImmediate(() => awsService.deleteFile3(files.audioFile[0].key));

        if (files.imageFile && files.imageFile.length > 0)
            setImmediate(() => awsService.deleteFile3(files.imageFile[0].key));

        if (files.lyricFile && files.lyricFile.length > 0)
            setImmediate(() => awsService.deleteFile3(files.lyricFile[0].key));

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
        if (song.filePathAudio) setImmediate(() => awsService.deleteFile3(song.filePathAudio));
        if (song.image) setImmediate(() => awsService.deleteFile3(song.image));
        if (song.lyric) setImmediate(() => awsService.deleteFile3(song.lyric));
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

// -----------------notification

const getAllNotificationsService = async ({ user, page = 1, limit = 10 } = {}) => {
    try {
        const offset = (page - 1) * limit;
        const count = await db.Notifications.count({ where: { userId: user.id, isRead: false } });
        const notifications = await db.Notifications.findAll({
            order: [
                ['isRead', 'ASC'],
                ['updatedAt', 'DESC'],
            ],
            limit: limit,
            offset: offset,
        });
        const formattedNotifications = await Promise.all(
            notifications.map(async (noti) => {
                const formatter = { ...noti.toJSON() };
                formatter.createdAt = formatTime(formatter.createdAt);
                formatter.updatedAt = formatTime(formatter.updatedAt);

                if (noti.type === 'COMMENT') {
                    const report = await db.Report.findOne({
                        where: { id: noti.from },
                        attributes: ['id', 'content', 'userId', 'status', 'createdAt'],
                        include: [
                            {
                                model: db.Comment,
                                as: 'comment',
                                attributes: ['id', 'songId', 'content', 'hide', 'createdAt'],
                                include: [
                                    {
                                        model: db.User,
                                        as: 'user',
                                        attributes: ['id', 'image', 'username', 'name', 'email'],
                                    },
                                ],
                            },
                        ],
                    });

                    if (report) {
                        const reportFormatter = report.toJSON();
                        reportFormatter.createdAt = formatTime(reportFormatter.createdAt);
                        reportFormatter.comment.createdAt = formatTime(reportFormatter.comment.createdAt);

                        if (
                            reportFormatter.comment.user &&
                            reportFormatter.comment.user.image &&
                            reportFormatter.comment.user.image.includes('PBL6')
                        ) {
                            reportFormatter.comment.user.image = `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_ENDPOINT}/${reportFormatter.comment.user.image}`;
                        }
                        formatter.report = reportFormatter;
                    }
                }

                return formatter;
            }),
        );
        return {
            notificationsNumber: count,
            notifications: formattedNotifications,
        };
    } catch (error) {
        throw error;
    }
};

const updateNotificationService = async ({ user } = {}) => {
    try {
        await db.Notifications.update({ isRead: true }, { where: { userId: user.id } });
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

            if (
                formatter.comment.user &&
                formatter.comment.user.image &&
                formatter.comment.user.image.includes('PBL6')
            ) {
                formatter.comment.user.image = `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_ENDPOINT}/${formatter.comment.user.image}`;
            }
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
            const payment = await db.Subscriptions.findOne({
                where: { id: noti.from },
                attributes: ['startDate', 'endDate', 'createdAt', 'updatedAt'],
                include: [{ model: db.SubscriptionPackage, as: 'package' }],
            });

            const formatter = payment.toJSON();
            formatter.startDate = formatTime(formatter.startDate);
            formatter.endDate = formatTime(formatter.endDate);
            formatter.createdAt = formatTime(formatter.createdAt);
            formatter.updatedAt = formatTime(formatter.updatedAt);
            formatter.package.createdAt = formatTime(formatter.package.createdAt);
            formatter.package.updatedAt = formatTime(formatter.package.updatedAt);

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
        const currentDate = new Date();
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
                from: b.id,
            }));

            expiredNotis = await db.Notifications.bulkCreate(notifications, { transaction });
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
                from: b.id,
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
    getInfoUserService,
    getInfoUserService2,
    getPlaylistService,
    getPlaylistDetailService,
    getSongOfPlaylistService,
    createPlaylistService,
    addSongPlaylistService,
    updatePlaylistService,
    deleteSongService,
    deletePlaylistService,
    updateUserService,
    changePasswordService,
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
    updateNotificationService,
    getNotiDetailService,
    getReportDetailService,
    downloadSongService,
    // ---------------cron job
    updateAccountType,
};
