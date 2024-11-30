import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError';

import { userService } from '~/services/userService';
import { playlistService } from '~/services/playlistService';
import { songService } from '~/services/songService';

import emailController from '~/controllers/emailController';

const statusCodes = require('../utils/statusCodes');

const getInfoUser = async (req, res, next) => {
    try {
        const user = await userService.getInfoUserService(req.user);

        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Get info user success',
            user: user,
        });
    } catch (error) {
        next(error);
    }
};
const getPlaylist = async (req, res, next) => {
    try {
        if (req.query.page < 1) throw new ApiError(StatusCodes.BAD_REQUEST, 'Page must be greater than 1');

        const playlists = await userService.getPlaylistService({ user: req.user });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Get playlist by user success',
            ...playlists,
        });
    } catch (error) {
        next(error);
    }
};

const getPlaylistDetail = async (req, res, next) => {
    try {
        if (!req.params.playlistId) throw new ApiError(StatusCodes.BAD_REQUEST, 'Missing data: playlist id');

        const checkPlaylist = await playlistService.checkPlaylistExists(req.params.playlistId);
        if (!checkPlaylist) throw new ApiError(StatusCodes.NOT_FOUND, 'Playlist not found');

        const playlist = await userService.getPlaylistDetailService({
            playlistId: req.params.playlistId,
            user: req.user,
        });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Get playlist detail successfully',
            ...playlist,
        });
    } catch (error) {
        next(error);
    }
};

const getSongOfPlaylist = async (req, res, next) => {
    try {
        if (!req.params.playlistId) throw new ApiError(StatusCodes.BAD_REQUEST, 'Missing data: playlist id');

        const checkPlaylist = await playlistService.checkPlaylistExists(req.params.playlistId);
        if (!checkPlaylist) throw new ApiError(StatusCodes.NOT_FOUND, 'Playlist not found');

        const songs = await userService.getSongOfPlaylistService({
            playlistId: req.params.playlistId,
            user: req.user,
        });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Get songs of playlist success',
            songsOfPlaylist: songs,
        });
    } catch (error) {
        next(error);
    }
};

const createPlaylist = async (req, res, next) => {
    try {
        const playlist = await userService.createPlaylistService({ data: req.body, user: req.user });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Create playlist success',
            ...playlist,
        });
    } catch (error) {
        next(error);
    }
};

const addSongPlaylist = async (req, res, next) => {
    try {
        // check missing data
        if (!req.body.playlistId || !req.body.songId)
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Missing data: playlist id or song id');
        // check playlist
        const checkPlaylist = await playlistService.checkPlaylistExists(req.body.playlistId);
        if (!checkPlaylist) throw new ApiError(StatusCodes.NOT_FOUND, 'Playlist not found');
        // check song
        const checkSong = await songService.checkSongExists(req.body.songId);
        if (!checkSong) throw new ApiError(StatusCodes.NOT_FOUND, 'Song not found');

        await userService.addSongPlaylistService({ data: req.body, user: req.user });
        const newSong = await songService.fetchSongs({ conditions: { id: req.body.songId }, mode: 'findOne' });
        // const playlist = await userService.getPlaylistDetailService({
        //     playlistId: req.body.playlistId,
        //     user: req.user,
        // });

        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Add song playlist success',
            newSong: newSong,
        });
    } catch (error) {
        next(error);
    }
};

const updatePlaylist = async (req, res, next) => {
    try {
        console.log('update playlsit', req.body);
        console.log('update playlsit', req.file);
        const { playlistId, data } = req.body;

        if (!playlistId) throw new ApiError(StatusCodes.BAD_REQUEST, 'Missing data: playlist id');
        // check playlist
        const checkPlaylist = await playlistService.checkPlaylistExists(playlistId);
        if (!checkPlaylist) throw new ApiError(StatusCodes.NOT_FOUND, 'Playlist not found');

        const playlist = await userService.updatePlaylistService({
            playlistId: playlistId,
            updateData: JSON.parse(data),
            user: req.user,
            file: req.file,
        });
        // const playlist = await userService.getPlaylistDetailService({
        //     playlistId: playlistId,
        //     user: req.user,
        // });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Update playlist success',
            playlist: playlist,
            // url: url,
        });
    } catch (error) {
        next(error);
    }
};

const deleteSong = async (req, res, next) => {
    try {
        if (!req.body.playlistId || !req.body.songId)
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Missing data: playlist id or song id');
        // check playlist
        const checkPlaylist = await playlistService.checkPlaylistExists(req.body.playlistId);
        if (!checkPlaylist) throw new ApiError(StatusCodes.NOT_FOUND, 'Playlist not found');
        // check song
        const checkSong = await songService.checkSongExists(req.body.songId);
        if (!checkSong) throw new ApiError(StatusCodes.NOT_FOUND, 'Song not found');

        await userService.deleteSongService({ data: req.body, user: req.user });
        const playlist = await userService.getPlaylistDetailService({
            playlistId: req.body.playlistId,
            user: req.user,
        });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Delete song from playlist success',
            ...playlist,
        });
    } catch (error) {
        next(error);
    }
};

const deletePlaylist = async (req, res, next) => {
    try {
        if (!req.params.playlistId) throw new ApiError(StatusCodes.BAD_REQUEST, 'Missing data: playlist id');
        // check playlist
        const checkPlaylist = await playlistService.checkPlaylistExists(req.params.playlistId);
        if (!checkPlaylist) throw new ApiError(StatusCodes.NOT_FOUND, 'Playlist not found');

        await userService.deletePlaylistService({ playlistId: req.params.playlistId, user: req.user });
        const playlists = await userService.getPlaylistService({ user: req.user });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Delete playlist success',
            ...playlists,
        });
    } catch (error) {
        next(error);
    }
};

// ----------------------actions

const playTime = async (req, res, next) => {
    try {
        await userService.playTimeService({ data: req.body, user: req.user });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Play time successfully',
        });
    } catch (error) {
        next(error);
    }
};

const likedSong = async (req, res, next) => {
    try {
        const liked = await userService.likedSongService({ data: req.body, user: req.user });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: liked ? 'Like Successfully' : 'Delete like successfully',
        });
    } catch (error) {
        next(error);
    }
};

const followedArtist = async (req, res, next) => {
    try {
        const follow = await userService.followedArtistService({ data: req.body, user: req.user });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: follow ? 'Follow Successfully' : 'Delete follow successfully',
        });
    } catch (error) {
        next(error);
    }
};

const comment = async (req, res, next) => {
    try {
        const comment = await userService.getCommentService({ data: req.body, user: req.user });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Comment successfully',
            comment: comment,
        });
    } catch (error) {
        next(error);
    }
};

const reportComment = async (req, res, next) => {
    try {
        const report = await userService.reportCommentService({ data: req.body, user: req.user });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Report comment successfully',
            report: report,
        });
    } catch (error) {
        next(error);
    }
};

const register = async (req, res) => {
    const data = req.body;
    const checkVerify = await emailController.verifyEmailOtp(data.email, data.otp);
    if (checkVerify) {
        delete data.otp;
        const response = await userService.registerService(data);
        return res.status(statusCodes[response.errCode]).json(response);
    } else {
        return res.status(409).json({
            errCode: 7,
            errMess: 'OTP is invalid or expired',
        });
    }
};

export const userController = {
    getInfoUser,
    getPlaylist,
    getPlaylistDetail,
    getSongOfPlaylist,
    createPlaylist,
    addSongPlaylist,
    updatePlaylist,
    deleteSong,
    deletePlaylist,

    // ---------actions
    playTime,
    likedSong,
    followedArtist,
    comment,
    reportComment,

    // -------- ....
    register,
};
