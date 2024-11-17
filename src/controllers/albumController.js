import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError';

import { albumService } from '~/services/albumService';

const getTopAlbum = async (req, res, next) => {
    try {
        if (req.query.page < 1) throw new ApiError(StatusCodes.BAD_REQUEST, 'Page must be greater than 1');
        const result = await albumService.getTopAlbumService({ page: req.query.page });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Get top album success',
            ...result,
        });
    } catch (error) {
        next(error);
    }
};

const getAlbum = async (req, res, next) => {
    try {
        if (!req.params.albumId) throw new ApiError(StatusCodes.BAD_REQUEST, 'Missing data: album id');
        const album = await albumService.getAlbumService({ albumId: req.params.albumId });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Get album success',
            album: album,
        });
    } catch (error) {
        next(error);
    }
};

const getAlbumAnother = async (req, res, next) => {
    try {
        if (req.query.page < 1) throw new ApiError(StatusCodes.BAD_REQUEST, 'Page must be greater than 1');
        if (!req.params.albumId) throw new ApiError(StatusCodes.BAD_REQUEST, 'Missing data: album id');
        const albumAnother = await albumService.getAlbumAnotherService({
            albumId: req.params.albumId,
            page: req.query.page,
        });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Get album another success',
            ...albumAnother,
        });
    } catch (error) {
        next(error);
    }
};

export const albumController = {
    getTopAlbum,
    getAlbum,
    getAlbumAnother,
};
