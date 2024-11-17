import express from 'express';
const Router = express.Router();
import multer from 'multer';
const upload = multer();
// import mm from 'music-metadata';
const mm = require('music-metadata');

import { appValidations } from '~/validations/appValidation';
// import { audioUpload, multerErrorHandler } from '~/config/multerConfig';

import { adminController } from '~/controllers/adminController';
import { baoloc } from '~/utils/encryption';

// Middleware để tính toán thời lượng của file âm thanh
async function calculateDuration(req, res, next) {
    if (!req.file) {
        console.log('No file uploaded');
        return next();
    }
    console.log('File:', req.file); // Kiểm tra thông tin tệp
    try {
        const metadata = await mm.parseBuffer(req.file.buffer, { mimeType: req.file.mimetype });
        req.body.duration = metadata.format.duration; // duration in seconds
        console.log('Duration:', req.body.duration);
        next();
    } catch (error) {
        console.error('Error calculating duration:', error);
        next(error);
    }
}

Router.route('/create/genre').post(adminController.createGenre);
Router.route('/create/artist').post(upload.single('avatar'), adminController.createArtist);
Router.route('/create/song').post(
    upload.single('audioFile'),
    calculateDuration,
    // audioUpload.single('audioFile'),
    // appValidations.validateUploadSong,
    adminController.createSong,
    // multerErrorHandler,
);
Router.route('/create/album').post(upload.single('albumCover'), adminController.createAlbum);

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

// Router.route('/songDetail/:songId').get(adminController.getSongDetail);

Router.route('/test').get((req, res) => {
    res.render('createAlbum');
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
