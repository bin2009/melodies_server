import express from 'express';
const Router = express.Router();
import multer from 'multer';
import multerS3 from 'multer-s3';
import AWS from 'aws-sdk';

import { authMiddleWare } from '~/middleware/authMiddleWare';
import { userController } from '~/controllers/userController';
import { emailController } from '~/controllers/emailController';
import { playlistValidations } from '~/validations/playlistValidations';
import { appMiddleWare } from '~/middleware/appMiddleWare';

const upload = multer();

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
            if (file.fieldname) {
                cb(null, `PBL6/PUBLIC/USER_UPLOAD/${file.fieldname}/${uniqueSuffix}`);
            }
            if (file.fieldname === 'image') {
                cb(null, `PBL6/PUBLIC/USER_UPLOAD/${file.fieldname}/${uniqueSuffix}`);
            } else {
                cb(null, `PBL6/PRIVATE/USER_UPLOAD/${file.fieldname}/${uniqueSuffix}`); // Organize files by field name
            }
        },
    }),
});

Router.route('/user/playlist').get(authMiddleWare.verifyToken, userController.getPlaylist);
Router.route('/user/playlist/detail/:playlistId').get(authMiddleWare.verifyToken, userController.getPlaylistDetail);
Router.route('/user/playlist/detail/:playlistId/songs').get(
    authMiddleWare.verifyToken,
    userController.getSongOfPlaylist,
);
Router.route('/user/playlist/create').post(
    authMiddleWare.verifyToken,
    playlistValidations.createPlaylistValidation,
    userController.createPlaylist,
);
Router.route('/user/playlist/addSong').post(authMiddleWare.verifyToken, userController.addSongPlaylist);
Router.route('/user/playlist/update').patch(
    uploadS3.fields([{ name: 'playlistAvatar', maxCount: 1 }]),
    authMiddleWare.verifyToken,
    userController.updatePlaylist,
);
Router.route('/user/playlist/deleteSong').delete(authMiddleWare.verifyToken, userController.deleteSong);
Router.route('/user/playlist/deletePlaylist/:playlistId').delete(
    authMiddleWare.verifyToken,
    userController.deletePlaylist,
);

Router.route('/user/actions/playtime').post(authMiddleWare.verifyToken, userController.playTime);
Router.route('/user/actions/likedsong').post(authMiddleWare.verifyToken, userController.likedSong);
Router.route('/user/actions/followed').post(authMiddleWare.verifyToken, userController.followedArtist);
Router.route('/user/actions/comment').post(authMiddleWare.verifyToken, userController.comment);
Router.route('/user/actions/report').post(authMiddleWare.verifyToken, userController.reportComment);

Router.route('/user/otp').post(authMiddleWare.checkEmailAndUsernameExits, emailController.sendOtp);
Router.route('/user/register').post(userController.register);

Router.route('/user')
    .get(authMiddleWare.verifyToken, userController.getInfoUser)
    .patch(authMiddleWare.verifyToken, uploadS3.fields([{ name: 'image', maxCount: 1 }]), userController.updateUser);
Router.route('/user/changePassword').patch(authMiddleWare.verifyToken, userController.changePassword);
Router.route('/user/uploadSong').post(
    authMiddleWare.verifyToken,
    appMiddleWare.checkPremium,
    appMiddleWare.checkMaxUpload,
    uploadS3.fields([
        { name: 'audioFile', maxCount: 1 },
        { name: 'lyricFile', maxCount: 1 },
        { name: 'imageFile', maxCount: 1 },
    ]),
    userController.userUploadSong,
);
Router.route('/user/song/:songId')
    .get(authMiddleWare.verifyToken, userController.getUserSong)
    .patch(
        authMiddleWare.verifyToken,
        appMiddleWare.checkPremium,
        uploadS3.fields([
            { name: 'audioFile', maxCount: 1 },
            { name: 'lyricFile', maxCount: 1 },
            { name: 'imageFile', maxCount: 1 },
        ]),
        userController.updateUserSong,
    )
    .delete(authMiddleWare.verifyToken, appMiddleWare.checkPremium, userController.deleteUserSong);

Router.route('/user/notifications').get(authMiddleWare.verifyToken, userController.getAllNotifications);
Router.route('/user/notifications/:id').get(authMiddleWare.verifyToken, userController.getNotiDetail);
Router.route('/user/report/:reportId').get(authMiddleWare.verifyToken, userController.getReportDetail);
Router.route('/user/download/:songId').post(authMiddleWare.verifyToken, userController.downloadSong);

import db from '~/models';
Router.route('/user/test/:userId').get(async (req, res, next) => {
    try {
        const user = await db.User.findByPk(req.params.userId);
        // console.log('user: ', user);
        // const user = await userService.getInfoUserService(req.user);
        res.render('updateUser', { user: user.get({ plain: true }) });
    } catch (error) {
        next(error);
    }
});

Router.route('/user/haha/:songId').get(async (req, res, next) => {
    try {
        // res.render('userUploadSong');
        const song = await db.Song.findByPk(req.params.songId);
        res.render('userUpdateSong', { song: song });
    } catch (error) {
        next(error);
    }
});
Router.route('/user/haha2').get(async (req, res, next) => {
    try {
        res.render('userUploadSong');
    } catch (error) {
        next(error);
    }
});
export default Router;
