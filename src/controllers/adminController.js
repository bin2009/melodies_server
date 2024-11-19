import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError';

import { adminService } from '~/services/adminService';
import { genreService } from '~/services/genreService';
import { artistService } from '~/services/artistService';
import { userService } from '~/services/userService';
import { commentService } from '~/services/commentService';
import { albumService } from '~/services/albumService';
import db from '~/models';

const createGenre = async (req, res, next) => {
    try {
        if (!req.body.name) throw new ApiError(StatusCodes.BAD_REQUEST, 'Missing data: genre name');

        const result = await genreService.createGenreService({ name: req.body.name });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Create genre success',
            ...result,
        });
    } catch (error) {
        next(error);
    }
};

const createArtist = async (req, res, next) => {
    try {
        const data = JSON.parse(req.body.data);
        console.log('data create artist', data);
        console.log('data create artist file', req.file);
        const result = await artistService.createArtistService({ data: data, file: req.file });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Create artist success',
            ...result,
        });
    } catch (error) {
        next(error);
    }
};

const createSong = async (req, res, next) => {
    try {
        // const { mainArtistId, subArtistIds } = req.body;
        const { data } = req.body;
        const parsedData = JSON.parse(data);
        console.log('data create song: ', parsedData);

        await adminService.createSongService({
            data: parsedData,
            file: req.file,
        });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Create song success',
            // ...result,
        });
    } catch (error) {
        next(error);
    }
};

const createAlbum = async (req, res, next) => {
    try {
        const { data } = req.body;
        const parsedData = JSON.parse(data);

        console.log('file: ', req.file);
        console.log(parsedData);

        const result = await adminService.createAlbum({ data: parsedData, file: req.file });

        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Create album success',
            // ...result,
        });
    } catch (error) {
        next(error);
    }
};

const createAdmin = async (req, res, next) => {
    try {
        await adminService.createAdminService({ data: req.body });

        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Create admin success',
        });
    } catch (error) {
        next(error);
    }
};

const getRecentUser = async (req, res, next) => {
    try {
        if (req.query.page < 1) throw new ApiError(StatusCodes.BAD_REQUEST, 'Page must be greater than 1');

        const response = await userService.getRecentUserService({ page: req.query.page });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Get recents users success',
            ...response,
        });
    } catch (error) {
        next(error);
    }
};

const getRecentComment = async (req, res, next) => {
    try {
        if (req.query.page < 1) throw new ApiError(StatusCodes.BAD_REQUEST, 'Page must be greater than 1');

        const response = await commentService.getRecentCommentService({ page: req.query.page });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Get recent comments success',
            ...response,
        });
    } catch (error) {
        next(error);
    }
};

const getTotalPlayAndCmtYear = async (req, res, next) => {
    try {
        const response = await adminService.getTotalPlayAndCmtYearService();
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Get total plays and comments success',
            ...response,
        });
    } catch (error) {
        next(error);
    }
};

const getUserGrowth = async (req, res, next) => {
    try {
        const response = await adminService.getUserGrowthService();
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Get user growth success',
            ...response,
        });
    } catch (error) {
        next(error);
    }
};

const getTotal = async (req, res, next) => {
    try {
        const response = await adminService.getTotalService();
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Get total success',
            ...response,
        });
    } catch (error) {
        next(error);
    }
};

const getTodayBestSong = async (req, res, next) => {
    try {
        const response = await adminService.getTodayBestSongService();
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: `Get Today's Best Song success`,
            ...response,
        });
    } catch (error) {
        next(error);
    }
};

const getAllAlbum = async (req, res, next) => {
    try {
        const response = await adminService.getAllAlbumService(req.query.query, req.query.order, req.query.page);
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: `Get Today's Best Song success`,
            ...response,
        });
    } catch (error) {
        next(error);
    }
};

const getAllGenreName = async (req, res, next) => {
    try {
        const response = await genreService.fetchGenre();
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: `Get all genre success`,
            genres: response,
        });
    } catch (error) {
        next(error);
    }
};

const getAllArtistName = async (req, res, next) => {
    try {
        const artists = await artistService.fetchArtistName();
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: `Get artist name success`,
            artists: artists,
        });
    } catch (error) {
        next(error);
    }
};

const getAllUser = async (req, res, next) => {
    try {
        if (req.query.page < 1) throw new ApiError(StatusCodes.BAD_REQUEST, 'Page must be greater than 1');

        const response = await adminService.getAllUserService({ page: req.query.page });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Get all user success',
            ...response,
        });
    } catch (error) {
        next(error);
    }
};

export const adminController = {
    createGenre,
    createArtist,
    createSong,
    createAlbum,
    createAdmin,
    // --------------
    getRecentUser,
    getRecentComment,
    getTotalPlayAndCmtYear,
    getUserGrowth,
    getTotal,
    getTodayBestSong,
    getAllGenreName,
    getAllArtistName,
    getAllUser,
    // ------------
    getAllAlbum,
};
