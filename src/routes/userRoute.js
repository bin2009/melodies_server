import express from 'express';
const Router = express.Router();
import multer from 'multer';

import { authMiddleWare } from '~/middleware/authMiddleWare';
import { userController } from '~/controllers/userController';
import { emailController } from '~/controllers/emailController';
import { playlistValidations } from '~/validations/playlistValidations';
import { appMiddleWare } from '~/middleware/appMiddleWare';
import { userService } from '~/services/userService';

const upload = multer();

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
    upload.single('playlistAvatar'),
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
    .patch(authMiddleWare.verifyToken, upload.single('image'), userController.updateUser);
Router.route('/user/uploadSong').post(
    authMiddleWare.verifyToken,
    appMiddleWare.checkPremium,
    appMiddleWare.checkMaxUpload,
    upload.fields([
        { name: 'audioFile', maxCount: 1 },
        { name: 'lyricFile', maxCount: 1 },
    ]),
    appMiddleWare.calculateDuration,
    userController.userUploadSong,
);
Router.route('/user/song/:songId')
    .get(authMiddleWare.verifyToken, userController.getUserSong)
    .patch(
        authMiddleWare.verifyToken,
        appMiddleWare.checkPremium,
        upload.fields([
            { name: 'audioFile', maxCount: 1 },
            { name: 'lyricFile', maxCount: 1 },
        ]),
        appMiddleWare.calculateDuration,
        userController.updateUserSong,
    );

Router.route('/user/notifications').get(authMiddleWare.verifyToken, userController.getAllNotifications);
Router.route('/user/report/:reportId').get(authMiddleWare.verifyToken, userController.getReportDetail);

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

export default Router;
