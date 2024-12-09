import express from 'express';
const Router = express.Router();
import multer from 'multer';
const upload = multer();

import { appValidations } from '~/validations/appValidation';
// import { audioUpload, multerErrorHandler } from '~/config/multerConfig';

import { adminController } from '~/controllers/adminController';

// ----------- create

Router.route('/create/admin').post(authMiddleWare.verifyTokenAndAdmin, adminController.createAdmin);
Router.route('/create/genre').post(authMiddleWare.verifyTokenAndAdmin, adminController.createGenre);
Router.route('/create/artist').post(
    authMiddleWare.verifyTokenAndAdmin,
    upload.single('avatar'),
    adminController.createArtist,
);
Router.route('/create/song').post(
    authMiddleWare.verifyTokenAndAdmin,
    upload.fields([
        { name: 'audioFile', maxCount: 1 },
        { name: 'lyricFile', maxCount: 1 },
    ]),
    appMiddleWare.calculateDuration,
    adminController.createSong,
);
Router.route('/create/album').post(
    authMiddleWare.verifyTokenAndAdmin,
    upload.single('albumCover'),
    adminController.createAlbum,
);
Router.route('/create/package').post(
    authMiddleWare.verifyTokenAndAdmin,
    appValidations.validateCreatePackage,
    adminController.createPackage,
);

// ----------- update

Router.route('/update/album/:albumId').patch(
    authMiddleWare.verifyTokenAndAdmin,
    upload.single('albumCover'),
    adminController.updateAlbum,
);
Router.route('/update/artist/:artistId').patch(
    authMiddleWare.verifyTokenAndAdmin,
    upload.single('avatar'),
    adminController.updateArtist,
);
Router.route('/update/song/:songId').patch(
    authMiddleWare.verifyTokenAndAdmin,
    upload.fields([
        { name: 'audioFile', maxCount: 1 },
        { name: 'lyricFile', maxCount: 1 },
    ]),
    appMiddleWare.calculateDuration,
    adminController.updateSong,
);
Router.route('/update/genre/:genreId').patch(authMiddleWare.verifyTokenAndAdmin, adminController.updateGenre);

// ----------- delete

Router.route('/delete/album').delete(authMiddleWare.verifyTokenAndAdmin, adminController.deleteAlbum);
Router.route('/delete/artist').delete(authMiddleWare.verifyTokenAndAdmin, adminController.deleteArtist);
Router.route('/delete/song').delete(authMiddleWare.verifyTokenAndAdmin, adminController.deleteSong);
Router.route('/delete/genre').delete(authMiddleWare.verifyTokenAndAdmin, adminController.deleteGenre);
Router.route('/delete/payment').delete(authMiddleWare.verifyTokenAndAdmin, adminController.deletePayment);

// -----------------------------------
Router.route('/recentUser').get(authMiddleWare.verifyTokenAndAdmin, adminController.getRecentUser);
Router.route('/recentComment').get(authMiddleWare.verifyTokenAndAdmin, adminController.getRecentComment);
Router.route('/totalPlayAndCmtYear').get(authMiddleWare.verifyTokenAndAdmin, adminController.getTotalPlayAndCmtYear);
Router.route('/userGrowth').get(authMiddleWare.verifyTokenAndAdmin, adminController.getUserGrowth);
Router.route('/total').get(authMiddleWare.verifyTokenAndAdmin, adminController.getTotal);
Router.route('/todayBestSong').get(authMiddleWare.verifyTokenAndAdmin, adminController.getTodayBestSong);

Router.route('/allAlbum').get(authMiddleWare.verifyTokenAndAdmin, adminController.getAllAlbum);
Router.route('/allGenre').get(authMiddleWare.verifyTokenAndAdmin, adminController.getAllGenreName);
Router.route('/allArtistName').get(authMiddleWare.verifyToken, adminController.getAllArtistName);
Router.route('/allUser').get(authMiddleWare.verifyTokenAndAdmin, adminController.getAllUser);
Router.route('/allReport').get(authMiddleWare.verifyTokenAndAdmin, adminController.getAllReport);
Router.route('/report/:reportId')
    .get(authMiddleWare.verifyTokenAndAdmin, adminController.getReport)
    .post(authMiddleWare.verifyTokenAndAdmin, adminController.verifyReport);
Router.route('/allPayment').get(authMiddleWare.verifyTokenAndAdmin, adminController.getAllPayment);
Router.route('/payment/:paymentId').get(authMiddleWare.verifyToken, adminController.getPaymentDetail);

Router.route('/allPackage').get(authMiddleWare.verifyTokenAndAdmin, adminController.getAllPackage);

import db from '~/models';
import { albumService } from '~/services/albumService';
import { artistService } from '~/services/artistService';
import { songService } from '~/services/songService';
import { authMiddleWare } from '~/middleware/authMiddleWare';
import { appMiddleWare } from '~/middleware/appMiddleWare';
Router.route('/test/:songId').get(async (req, res) => {
    // const artist = await artistService.getArtistService({ artistId: req.params.artistId });
    // res.render('updateArtist', { artist: artist });

    // const album = await albumService.getAlbumService({ albumId: req.params.albumId });
    // res.render('updateAlbum', { album: album });

    const song = await songService.fetchSongs({ conditions: { id: req.params.songId }, mode: 'findOne' });
    res.render('updateSong', { song: song });
});
Router.route('/test2').get(async (req, res) => {
    res.render('userUpdateSong');
});

export default Router;
