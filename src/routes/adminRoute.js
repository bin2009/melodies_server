import express from 'express';
const Router = express.Router();
import multer from 'multer';
const upload = multer();
// import mm from 'music-metadata';
// import { Readable } from 'stream';
// import * as mm from 'music-metadata';
import { parseBuffer } from 'music-metadata';

import { appValidations } from '~/validations/appValidation';
// import { audioUpload, multerErrorHandler } from '~/config/multerConfig';

import { adminController } from '~/controllers/adminController';
import { baoloc } from '~/utils/encryption';

// Middleware để tính toán thời lượng của file âm thanh
async function calculateDuration(req, res, next) {
    if (!req.files) {
        console.log('No file uploaded');
        return next();
    }
    // console.log('Check file:', req.files.audioFile[0]); // Kiểm tra thông tin tệp
    try {
        // lấy buffer từ tệp đã tải lên
        const buffer = req.files.audioFile[0].buffer;
        // console.log('buffer: ', buffer);
        const mimeType = req.files.audioFile[0].mimetype;
        // console.log('mimeType: ', mimeType);

        const metadata = await parseBuffer(buffer, mimeType);
        // console.log('metadata', metadata);
        req.duration = metadata.format.duration; // duration in seconds
        console.log('Duration:', req.duration);
        next();
    } catch (error) {
        console.error('Error calculating duration:', error);
        next(error);
    }
}

// ----------- create

Router.route('/create/admin').post(adminController.createAdmin);
Router.route('/create/genre').post(adminController.createGenre);
Router.route('/create/artist').post(upload.single('avatar'), adminController.createArtist);
Router.route('/create/song').post(
    // upload.single('audioFile'),
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
Router.route('/create/album').post(upload.single('albumCover'), adminController.createAlbum);
Router.route('/create/package').post(appValidations.validateCreatePackage, adminController.createPackage);

// ----------- update

Router.route('/update/album/:albumId').patch(upload.single('albumCover'), adminController.updateAlbum);
Router.route('/update/artist/:artistId').patch(upload.single('avatar'), adminController.updateArtist);
Router.route('/update/song/:songId').patch(
    upload.fields([
        { name: 'audioFile', maxCount: 1 },
        { name: 'lyricFile', maxCount: 1 },
    ]),
    calculateDuration,
    adminController.updateSong,
);
// Router.route('/update/song/:songId').patch(upload.none(), calculateDuration, adminController.updateSong);

// ----------- delete

Router.route('/delete/album').delete(adminController.deleteAlbum);
Router.route('/delete/artist').patch(adminController.deleteArtist);
Router.route('/delete/song').delete(adminController.deleteSong);

// -----------------------------------
Router.route('/recentUser').get(adminController.getRecentUser);
Router.route('/recentComment').get(adminController.getRecentComment);
Router.route('/totalPlayAndCmtYear').get(adminController.getTotalPlayAndCmtYear);
Router.route('/userGrowth').get(adminController.getUserGrowth);
Router.route('/total').get(adminController.getTotal);
Router.route('/todayBestSong').get(adminController.getTodayBestSong);

Router.route('/allAlbum').get(adminController.getAllAlbum);
Router.route('/allGenre').get(adminController.getAllGenreName);
Router.route('/allArtistName').get(adminController.getAllArtistName);
Router.route('/allUser').get(adminController.getAllUser);

Router.route('/allPackage').get(adminController.getAllPackage);

// Router.route('/songDetail/:songId').get(adminController.getSongDetail);
import db from '~/models';
import { albumService } from '~/services/albumService';
import { artistService } from '~/services/artistService';
import { songService } from '~/services/songService';
Router.route('/test/:artistId').get(async (req, res) => {
    const artist = await artistService.getArtistService({ artistId: req.params.artistId });
    res.render('updateArtist', { artist: artist });

    // const album = await albumService.getAlbumService({ albumId: req.params.albumId });
    // res.render('updateAlbum', { album: album });

    // const song = await songService.fetchSongs({ conditions: { id: req.params.songId }, mode: 'findOne' });
    // res.render('updateSong', { song: song });
});
Router.route('/test2').get(async (req, res) => {
    res.render('createSong');
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
