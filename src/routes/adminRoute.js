import express from 'express';
const Router = express.Router();
import multer from 'multer';
import multerS3 from 'multer-s3';
const upload = multer();
import AWS from 'aws-sdk';

import { appValidations } from '~/validations/appValidation';
// import { audioUpload, multerErrorHandler } from '~/config/multerConfig';

import { adminController } from '~/controllers/adminController';

const spacesEndpoint = new AWS.Endpoint(process.env.DO_SPACES_ENDPOINT);
const s3 = new AWS.S3({
    endpoint: spacesEndpoint,
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET,
});

const uploadS3 = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.DO_SPACES_BUCKET,
        acl: 'public-read',
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            console.log('file.fieldname: ', file.fieldname);
            if (file.fieldname === 'avatar') {
                cb(null, `PBL6/PUBLIC/ARTIST/${file.fieldname}/${uniqueSuffix}`);
            } else if (file.fieldname === 'lyricFile') {
                cb(null, `PBL6/PRIVATE/MELODIES/${file.fieldname}/${uniqueSuffix}.json`);
            } else {
                cb(null, `PBL6/PRIVATE/MELODIES/${file.fieldname}/${uniqueSuffix}`);
            }
        },
        // transfroms: [
        //     {
        //         id: 'thumbnail',
        //         key: (req, file, cb) => {
        //             const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        //             cb(null, `PBL6/PUBLIC/ARTIST/thumbnail/${uniqueSuffix}`);
        //         },
        //         transform: (req, file, cb) => {
        //             // Tạo thumbnail
        //             cb(null, sharp()
        //                 .resize(200, 200)
        //                 .jpeg({ quality: 90 })
        //             );
        //         }
        //     },
        // ]
    }),
});

// ----------- create

Router.route('/create/admin').post(authMiddleWare.verifyTokenAndAdmin, adminController.createAdmin);
Router.route('/create/genre').post(authMiddleWare.verifyTokenAndAdmin, adminController.createGenre);
Router.route('/create/artist').post(
    authMiddleWare.verifyTokenAndAdmin,
    uploadS3.fields([{ name: 'avatar', maxCount: 1 }]),
    adminController.createArtist,
);
Router.route('/create/song').post(
    authMiddleWare.verifyTokenAndAdmin,
    uploadS3.fields([
        { name: 'audioFile', maxCount: 1 },
        { name: 'lyricFile', maxCount: 1 },
    ]),
    adminController.createSong,
);
Router.route('/create/album').post(
    authMiddleWare.verifyTokenAndAdmin,
    uploadS3.fields([{ name: 'albumCover', maxCount: 1 }]),
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
    uploadS3.fields([{ name: 'albumCover', maxCount: 1 }]),
    adminController.updateAlbum,
);
Router.route('/update/artist/:artistId').patch(
    authMiddleWare.verifyTokenAndAdmin,
    uploadS3.fields([{ name: 'avatar', maxCount: 1 }]),
    adminController.updateArtist,
);
Router.route('/update/song/:songId').patch(
    authMiddleWare.verifyTokenAndAdmin,
    uploadS3.fields([
        { name: 'audioFile', maxCount: 1 },
        { name: 'lyricFile', maxCount: 1 },
    ]),
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
Router.route('/allGenre').get(authMiddleWare.verifyToken, adminController.getAllGenreName);
Router.route('/allArtistName').get(authMiddleWare.verifyToken, adminController.getAllArtistName);
Router.route('/allUser').get(authMiddleWare.verifyTokenAndAdmin, adminController.getAllUser);
Router.route('/allReport').get(authMiddleWare.verifyTokenAndAdmin, adminController.getAllReport);
Router.route('/report/:reportId')
    .get(authMiddleWare.verifyTokenAndAdmin, adminController.getReport)
    .patch(authMiddleWare.verifyTokenAndAdmin, adminController.verifyReport);
Router.route('/report/:reportId/reject').patch(authMiddleWare.verifyTokenAndAdmin, adminController.rejectReport);
Router.route('/allPayment').get(authMiddleWare.verifyTokenAndAdmin, adminController.getAllPayment);
Router.route('/payment/:paymentId').get(authMiddleWare.verifyToken, adminController.getPaymentDetail);

Router.route('/allPackage').get(adminController.getAllPackage);

import db from '~/models';
import { albumService } from '~/services/albumService';
import { artistService } from '~/services/artistService';
import { songService } from '~/services/songService';
import { authMiddleWare } from '~/middleware/authMiddleWare';
import { appMiddleWare } from '~/middleware/appMiddleWare';
import { REPORT_STATUS } from '~/data/enum';
Router.route('/test/:songId').get(async (req, res) => {
    // const artist = await artistService.getArtistService({ artistId: req.params.artistId });
    // res.render('updateArtist', { artist: artist });

    // const album = await albumService.getAlbumService({ albumId: req.params.albumId });
    // res.render('updateAlbum', { album: album });

    const song = await songService.fetchSongs({ conditions: { id: req.params.songId }, mode: 'findOne' });
    res.render('updateSong', { song: song });
});
Router.route('/test2').get(async (req, res) => {
    console.log('haha: ', Object.keys(REPORT_STATUS));
    console.log('haha: ', Object.values(REPORT_STATUS));
    console.log('haha: ', REPORT_STATUS['PENDING']);
    console.log('haha: ', REPORT_STATUS['PENDING']);
    // res.send('haha');
    res.render('create');
    // res.render('userUpdateSong');
});

export default Router;
