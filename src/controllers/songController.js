import { StatusCodes } from 'http-status-codes';
import { songService } from '~/services/songService';
import { artistService } from '~/services/artistService';
import ApiError from '~/utils/ApiError';
import { commentService } from '~/services/commentService';

const getAllSong = async (req, res, next) => {
    try {
        if (req.query.page < 1) throw new ApiError(StatusCodes.BAD_REQUEST, 'Page must be greater than 1');

        const response = await songService.getAllSongService({ page: req.query.page });

        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Get all song success',
            ...response,
        });
    } catch (error) {
        next(error);
    }
};

const getSong = async (req, res) => {
    const response = await songService.getSongService(req.params.id, req.user);
    return res.status(response.errCode).json(response);
};

const getWeeklyTopSongs = async (req, res, next) => {
    try {
        if (req.query.page < 1) throw new ApiError(StatusCodes.BAD_REQUEST, 'Page must be greater than 1');

        const weeklyTopSongs = await songService.getWeeklyTopSongsService({ page: req.query.page, user: req.user });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Get weekly top song success',
            ...weeklyTopSongs,
        });
    } catch (error) {
        next(error);
    }
};

const getTrendingSongs = async (req, res, next) => {
    try {
        if (req.query.page < 1) throw new ApiError(StatusCodes.BAD_REQUEST, 'Page must be greater than 1');

        const trendingSongs = await songService.getTrendingSongsService({ page: req.query.page, user: req.user });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Get trendings song success',
            ...trendingSongs,
        });
    } catch (error) {
        next(error);
    }
};

const getNewReleaseSongs = async (req, res, next) => {
    try {
        if (!req.query.page) throw new ApiError(StatusCodes.BAD_REQUEST, 'Mising page');
        if (req.query.page < 1) throw new ApiError(StatusCodes.BAD_REQUEST, 'Page must be greater than 1');

        const newReleaseSongs = await songService.getNewReleaseSongsService({ page: req.query.page, user: req.user });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Get release song success',
            ...newReleaseSongs,
        });
    } catch (error) {
        next(error);
    }
};

const getOtherSongByArtist = async (req, res, next) => {
    try {
        if (!req.params.artistId) throw new ApiError(StatusCodes.BAD_REQUEST, 'Mising data: artist Id');

        if (req.query.page < 1) throw new ApiError(StatusCodes.BAD_REQUEST, 'Page must be greater than 1');

        const artist = await artistService.checkArtistExits(req.params.artistId);
        if (!artist) throw new ApiError(StatusCodes.NOT_FOUND, 'Artist not found');

        const songs = await songService.getOtherSongByArtistService({
            artistId: req.params.artistId,
            page: req.query.page,
            user: req.user,
        });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Get other song by artist success',
            ...songs,
        });
    } catch (error) {
        next(error);
    }
};

const getSongOtherArtist = async (req, res, next) => {
    try {
        if (!req.query.page || !req.params.artistId)
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Mising data: page or artist Id');

        if (req.query.page < 1) throw new ApiError(StatusCodes.BAD_REQUEST, 'Page must be greater than 1');

        const artist = await artistService.checkArtistExits(req.params.artistId);
        if (!artist) throw new ApiError(StatusCodes.NOT_FOUND, 'Artist not found');

        const songs = await songService.getSongOtherArtistService({
            artistId: req.params.artistId,
            page: req.query.page,
            user: req.user,
        });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Get song other artist success',
            ...songs,
        });
    } catch (error) {
        next(error);
    }
};

const getSongSameGenre = async (req, res, next) => {
    try {
        if (!req.query.page || !req.params.artistId)
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Mising data: page or artist Id');

        if (req.query.page < 1) throw new ApiError(StatusCodes.BAD_REQUEST, 'Page must be greater than 1');

        const artist = await artistService.checkArtistExits(req.params.artistId);
        if (!artist) throw new ApiError(StatusCodes.NOT_FOUND, 'Artist not found');

        const songs = await songService.getSongSameGenreService({
            artistId: req.params.artistId,
            page: req.query.page,
            user: req.user,
        });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Get song same genre success',
            ...songs,
        });
    } catch (error) {
        next(error);
    }
};

// ---------------------------COMMENT------------------

const getCommentSong = async (req, res, next) => {
    try {
        if (!req.query.page || !req.params.songId)
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Mising data: page or song Id');

        if (req.query.page < 1) throw new ApiError(StatusCodes.BAD_REQUEST, 'Page must be greater than 1');

        const song = await songService.checkSongExists(req.params.songId);
        if (!song) throw new ApiError(StatusCodes.NOT_FOUND, 'Song not found');

        const comments = await songService.getCommentSongService({
            songId: req.params.songId,
            page: req.query.page,
            user: req.user,
        });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Get comment success',
            ...comments,
        });
    } catch (error) {
        next(error);
    }
};

const getCommentChild = async (req, res, next) => {
    try {
        if (!req.query.page || !req.params.parentId)
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Mising data: page or comment Id');

        if (req.query.page < 1) throw new ApiError(StatusCodes.BAD_REQUEST, 'Page must be greater than 1');

        const comment = await commentService.checkCommentExits(req.params.parentId);
        if (!comment) throw new ApiError(StatusCodes.NOT_FOUND, 'Comment not found');

        const comments = await songService.getCommentChildService({
            parentId: req.params.parentId,
            page: req.query.page,
            user: req.user,
        });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Get comment success',
            ...comments,
        });
    } catch (error) {
        next(error);
    }
};

export const songController = {
    getAllSong,
    getSong,
    getWeeklyTopSongs,
    getTrendingSongs,
    getNewReleaseSongs,
    getOtherSongByArtist,
    getSongOtherArtist,
    getSongSameGenre,
    getCommentSong,
    getCommentChild,
};
