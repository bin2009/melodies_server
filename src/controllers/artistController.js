import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError';

import { artistService } from '~/services/artistService';

const getAllArtist = async (req, res, next) => {
    try {
        if (req.query.page < 1) throw new ApiError(StatusCodes.BAD_REQUEST, 'Page must be greater than 1');
        const artists = await artistService.getAllArtistService({
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder,
            page: req.query.page,
            user: req.user,
        });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Get all artists successfully',
            ...artists,
        });
    } catch (error) {
        next(error);
    }
};

const getPopularArtist = async (req, res, next) => {
    try {
        if (req.query.page < 1) throw new ApiError(StatusCodes.BAD_REQUEST, 'Page must be greater than 1');

        const artists = await artistService.getPopularArtistService({ page: req.query.page, user: req.user });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Get popular artists successfully',
            ...artists,
        });
    } catch (error) {
        next(error);
    }
};

const getArtist = async (req, res, next) => {
    try {
        const artist = await artistService.getArtistService({ artistId: req.params.id, user: req.user });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Get artist successfully',
            artist: artist,
        });
    } catch (error) {
        next(error);
    }
};

const getSongOfArtist = async (req, res, next) => {
    try {
        const songs = await artistService.getSongOfArtistService({ artistId: req.params.id });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Get song of artist successfully',
            songs: songs,
        });
    } catch (error) {
        next(error);
    }
};

const getPopSong = async (req, res, next) => {
    try {
        const response = await artistService.getPopSongService({
            artistId: req.params.artistId,
            page: req.query.page,
            user: req.user,
        });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Get pop song from artist success',
            ...response,
        });
    } catch (error) {
        next(error);
    }
};

const getAlbumFromArtist = async (req, res, next) => {
    try {
        if (req.query.page < 1) throw new ApiError(StatusCodes.BAD_REQUEST, 'Page must be greater than 1');
        const response = await artistService.getAlbumFromArtistService({
            artistId: req.params.artistId,
            page: req.query.page,
        });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'get album from artist success',
            ...response,
        });
    } catch (error) {
        next(error);
    }
};

const getSingleFromArtist = async (req, res, next) => {
    try {
        if (req.query.page < 1) throw new ApiError(StatusCodes.BAD_REQUEST, 'Page must be greater than 1');
        const response = await artistService.getSingleFromArtistService({
            artistId: req.params.artistId,
            page: req.query.page,
        });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Get single from artist success',
            ...response,
        });
    } catch (error) {
        next(error);
    }
};

const getArtistFeat = async (req, res, next) => {
    try {
        if (req.query.page < 1) throw new ApiError(StatusCodes.BAD_REQUEST, 'Page must be greater than 1');
        const response = await artistService.getArtistFeatService({
            artistId: req.params.artistId,
            page: req.query.page,
        });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Get artist feat success',
            ...response,
        });
    } catch (error) {
        next(error);
    }
};

const getArtistSameGenre = async (req, res, next) => {
    try {
        if (req.query.page < 1) throw new ApiError(StatusCodes.BAD_REQUEST, 'Page must be greater than 1');
        const response = await artistService.getArtistSameGenreService({
            artistId: req.params.artistId,
            page: req.query.page,
        });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Get artist same genre success',
            ...response,
        });
    } catch (error) {
        next(error);
    }
};

export const artistController = {
    getAllArtist,
    getArtist,
    getSongOfArtist,
    getPopularArtist,
    getPopSong,
    getAlbumFromArtist,
    getSingleFromArtist,
    getArtistFeat,
    getArtistSameGenre,
};
