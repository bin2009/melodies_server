import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError';

import { adminService } from '~/services/adminService';
import { genreService } from '~/services/genreService';
import { artistService } from '~/services/artistService';
import { userService } from '~/services/userService';
import { commentService } from '~/services/commentService';
import { albumService } from '~/services/albumService';
import db from '~/models';
import { packageService } from '~/services/packageService';
import { songService } from '~/services/songService';

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
        await artistService.createArtistService({ data: data, file: req.files });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Create artist success',
        });
    } catch (error) {
        next(error);
    }
};

const createSong = async (req, res, next) => {
    try {
        const { data, duration } = req.body;
        const parsedData = JSON.parse(data);
        const parsedDuration = JSON.parse(duration);

        await adminService.createSongService({
            data: parsedData,
            duration: parsedDuration,
            files: req.files,
        });

        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Create song success',
        });
    } catch (error) {
        next(error);
    }
};

const createAlbum = async (req, res, next) => {
    try {
        const { data } = req.body;
        const parsedData = JSON.parse(data);

        await adminService.createAlbum({ data: parsedData, file: req.files });

        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Create album success',
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

const createPackage = async (req, res, next) => {
    try {
        const data = req.body;

        const result = await packageService.createPackageService({ data: data });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Create package success',
            package: result,
        });
    } catch (error) {
        next(error);
    }
};

// -----------------------------------------------------------------------------------------------

const updateAlbum = async (req, res, next) => {
    try {
        const { data } = req.body;
        const parsedData = JSON.parse(data);

        await adminService.updateAlbumService({
            albumId: req.params.albumId,
            data: parsedData,
            file: req.files,
        });

        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Update album success',
        });
    } catch (error) {
        next(error);
    }
};

const updateArtist = async (req, res, next) => {
    try {
        const { data } = req.body;
        const parsedData = JSON.parse(data);
        await adminService.updateArtistService({
            artistId: req.params.artistId,
            data: parsedData,
            file: req.files,
        });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Update artist success',
        });
    } catch (error) {
        next(error);
    }
};

const updateSong = async (req, res, next) => {
    try {
        const { data } = req.body;
        const parsedData = JSON.parse(data);

        const result = await adminService.updateSongService({
            songId: req.params.songId,
            data: parsedData,
            files: req.files,
        });
        const song = await songService.fetchSongs({ conditions: { id: req.params.songId } });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Update song success',
            song: song,
            ...result,
        });
    } catch (error) {
        next(error);
    }
};

const updateGenre = async (req, res, next) => {
    try {
        if (!req.params.genreId) throw new ApiError(StatusCodes.BAD_REQUEST, 'Missing data: genre id');

        const genre = await adminService.updateGenreService({ genreId: req.params.genreId, data: req.body });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Update genre success',
            ...genre,
        });
    } catch (error) {
        next(error);
    }
};

// -----------------------------------------------------------------------------------------------

const deleteAlbum = async (req, res, next) => {
    try {
        await adminService.deleteAlbumService({ albumIds: req.body.albumIds });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Delete album success',
        });
    } catch (error) {
        next(error);
    }
};

const deleteArtist = async (req, res, next) => {
    try {
        console.log('artists: ', req.body.artistIds);
        await adminService.deleteArtistService({ artistIds: req.body.artistIds });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Delete artist success',
        });
    } catch (error) {
        next(error);
    }
};

const deleteSong = async (req, res, next) => {
    try {
        await adminService.deleteSongService({ songIds: req.body.songIds });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Delete songs success',
        });
    } catch (error) {
        next(error);
    }
};

const deleteGenre = async (req, res, next) => {
    try {
        await adminService.deleteGenreService({ genreIds: req.body.genreIds });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Delete genres success',
        });
    } catch (error) {
        next(error);
    }
};

const deletePayment = async (req, res, next) => {
    try {
        await adminService.deletePaymentService({ paymentIds: req.body.paymentIds });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Delete payment success',
        });
    } catch (error) {
        next(error);
    }
};

// -----------------------------------------------------------------------------------------------

const searchAlbum = async (req, res, next) => {
    try {
        let result;

        if (!req.query.query) {
            result = await adminService.getAllAlbumService(req.query.query, req.query.order, req.query.page);
        } else {
            result = await adminService.searchAlbumService({
                query: req.query.query,
                page: req.query.page,
            });
        }

        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Search album success',
            ...result,
        });
    } catch (error) {
        next(error);
    }
};

const searchArtist = async (req, res, next) => {
    try {
        let result;

        if (!req.query.query) {
            result = await artistService.getAllArtistService({ page: req.query.page });
        } else {
            result = await adminService.searchArtistService({ query: req.query.query, page: req.query.page });
        }

        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Search artist success',
            ...result,
        });
    } catch (error) {
        next(error);
    }
};

const searchSong = async (req, res, next) => {
    try {
        let result;

        if (!req.query.query) {
            result = await songService.getAllSongService({ page: req.query.page });
        } else {
            result = await adminService.searchSongService({ query: req.query.query, page: req.query.page });
        }

        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Search song success',
            ...result,
        });
    } catch (error) {
        next(error);
    }
};

// -----------------------------------------------------------------------------------------------

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
            message: `Get all album success`,
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
        const artists = await artistService.fetchArtistName({ conditions: { hide: false } });
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

const getAllReport = async (req, res, next) => {
    try {
        if (req.query.page < 1) throw new ApiError(StatusCodes.BAD_REQUEST, 'Page must be greater than 1');

        const result = await adminService.getAllReportService({ page: req.query.page, type: req.query.type });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Get all report success',
            ...result,
        });
    } catch (error) {
        next(error);
    }
};

const getReport = async (req, res, next) => {
    try {
        const report = await adminService.getReportService(req.params.reportId);
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Get report success',
            report: report,
        });
    } catch (error) {
        next(error);
    }
};

const verifyReport = async (req, res, next) => {
    try {
        await adminService.verifyReportService(req.params.reportId);
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Verify report success',
        });
    } catch (error) {
        next(error);
    }
};

const rejectReport = async (req, res, next) => {
    try {
        await adminService.rejectReportService(req.params.reportId);
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Reject report success',
        });
    } catch (error) {
        next(error);
    }
};

const getAllPayment = async (req, res, next) => {
    try {
        const payments = await adminService.getAllPaymentService();
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Get all payments success',
            ...payments,
        });
    } catch (error) {
        next(error);
    }
};

const getPaymentDetail = async (req, res, next) => {
    try {
        const payment = await adminService.getPaymentDetailService({ user: req.user, paymentId: req.params.paymentId });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Get payment success',
            payment: payment,
        });
    } catch (error) {
        next(error);
    }
};

const getAllPackage = async (req, res, next) => {
    try {
        const packages = await packageService.fetchAllPackage();
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Get all packages success',
            packages: packages,
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
    createPackage,
    // ----------------
    updateAlbum,
    updateArtist,
    updateSong,
    updateGenre,
    // --------------
    deleteAlbum,
    deleteArtist,
    deleteSong,
    deleteGenre,
    deletePayment,
    // --------------
    searchAlbum,
    searchArtist,
    searchSong,
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
    getAllPackage,
    getAllReport,
    getReport,
    verifyReport,
    rejectReport,
    getAllPayment,
    getPaymentDetail,
    // ------------
    getAllAlbum,
};
