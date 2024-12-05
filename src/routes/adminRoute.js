import express from 'express';
const Router = express.Router();
import multer from 'multer';
const upload = multer();
import { parseBuffer } from 'music-metadata';

import { appValidations } from '~/validations/appValidation';
// import { audioUpload, multerErrorHandler } from '~/config/multerConfig';

import { adminController } from '~/controllers/adminController';
import { baoloc } from '~/utils/encryption';

async function calculateDuration(req, res, next) {
    try {
        if (!req.files.audioFile) {
            console.log('No file uploaded');
            return next();
        }
        console.log('1: ', req.files);
        console.log('2: ', req.files.audioFile);
        console.log('3: ', req.files.lyricFile);
        const buffer = req.files.audioFile[0].buffer;
        const mimeType = req.files.audioFile[0].mimetype;
        const metadata = await parseBuffer(buffer, mimeType);
        req.duration = metadata.format.duration;
        next();
    } catch (error) {
        next(error);
    }
}

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
    // upload.single('audioFile'),
    // upload.single('lyricFile'),
    upload.fields([
        { name: 'audioFile', maxCount: 1 },
        { name: 'lyricFile', maxCount: 1 },
    ]),
    calculateDuration,
    // audioUpload.single('audioFile'),
    // appValidations.validateUploadSong,
    adminController.createSong,
    // multerErrorHandler,
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
    calculateDuration,
    adminController.updateSong,
);
// Router.route('/update/song/:songId').patch(upload.none(), calculateDuration, adminController.updateSong);

// ----------- delete

Router.route('/delete/album').delete(authMiddleWare.verifyTokenAndAdmin, adminController.deleteAlbum);
Router.route('/delete/artist').patch(authMiddleWare.verifyTokenAndAdmin, adminController.deleteArtist);
Router.route('/delete/song').delete(authMiddleWare.verifyTokenAndAdmin, adminController.deleteSong);

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

Router.route('/allPackage').get(authMiddleWare.verifyTokenAndAdmin, adminController.getAllPackage);

// Router.route('/songDetail/:songId').get(adminController.getSongDetail);
import db from '~/models';
import { albumService } from '~/services/albumService';
import { artistService } from '~/services/artistService';
import { songService } from '~/services/songService';
import { authMiddleWare } from '~/middleware/authMiddleWare';
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
Router.route('/data').post(upload.single('avatar'), (req, res, next) => {
    try {
        res.status(200).json({
            message: 'Data received successfully',
            data: {
                name,
                bio,
                genres: JSON.parse(genres),
                avatar: avatar ? avatar.originalname : null,
            },
        });
    } catch (error) {
        next(error);
    }
});

Router.route('/en').get((req, res) => {
    const urlFromDB = 'https://example.com/resource?id=12345';

    // Chọn 2 secretKey
    const secretKey1 = process.env.KEY1;
    const secretKey2 = process.env.KEY2;

    // Mã hóa URL với 2 key
    const encryptedURL = baoloc.encryptURL(urlFromDB, secretKey1, secretKey2);

    res.json({ encryptedURL }); // Trả về URL đã mã hóa 2 lần
});

Router.route('/enview').get((req, res) => res.render('encode'));
export default Router;
