import express from 'express';
const Router = express.Router();
import multer from 'multer';

import { authMiddleWare } from '~/middleware/authMiddleWare';
import { userController } from '~/controllers/userController';
const emailController = require('~/controllers/emailController');
import { playlistValidations } from '~/validations/playlistValidations';

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

Router.route('/user/otp').post(authMiddleWare.checkEmailExits, emailController.sendOtp);
Router.route('/user/register').post(userController.register);

Router.route('/user').get(authMiddleWare.verifyToken, userController.getInfoUser);

Router.route('/test').patch((req, res) => {
    res.status(200).json('hah');
});
export default Router;
