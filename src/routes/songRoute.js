// const express = require('express');
// const router = express.Router();

// const authMiddleWare = require('../middleware/authMiddleWare');

// const songController = require('../controllers/songController');

// // -----------------SONG -----------------------

// router.get('/songs/weeklytopsongs', authMiddleWare.optionalVerifyToken, songController.getWeeklyTopSongs);
// router.get('/songs/trending', authMiddleWare.optionalVerifyToken, songController.getTrendingSongs);
// router.get('/songs/newRaleaseSong', authMiddleWare.optionalVerifyToken, songController.getNewReleaseSongs);

// router.get('/songs/random', songController.getSongRandom);
// router.get('/songs/search', songController.searchSong);

// router.get('/songs', authMiddleWare.optionalVerifyToken, songController.getAllSong);
// router.get('/songs/:id', authMiddleWare.optionalVerifyToken, songController.getSong);
// router.get('/songs/otherByArtist/:artistId', authMiddleWare.optionalVerifyToken, songController.getOtherSongByArtist);
// router.get('/songs/songOtherArtist/:artistId', authMiddleWare.optionalVerifyToken, songController.getSongOtherArtist);
// router.get('/songs/songSameGenre/:artistId', authMiddleWare.optionalVerifyToken, songController.getSongSameGenre);

// router.get('/songs/comment/:songId', authMiddleWare.optionalVerifyToken, songController.getCommentSong);
// router.get('/songs/comment/replies/:parentId', authMiddleWare.optionalVerifyToken, songController.getCommentChild);
// router.patch('/songs/comment/update', authMiddleWare.verifyToken, songController.updateComment);

// // -----------------PLAYLIST -----------------------

// router.get('/playlist', authMiddleWare.verifyToken, userController.getPlaylist);
// router.get('/playlist/detail/:playlistId', userController.getPlaylistDetail);
// router.post('/playlist/create', authMiddleWare.verifyToken, userController.createPlaylist);
// router.post('/playlist/addSong', authMiddleWare.verifyToken, userController.addSongPlaylist);
// router.patch('/playlist/update', authMiddleWare.verifyToken, userController.updatePlaylist);
// router.delete('/playlist/deleteSong', authMiddleWare.verifyToken, userController.deleteSong);
// router.delete('/playlist/deletePlaylist/:playlistId', authMiddleWare.verifyToken, userController.deletePlaylist);

// // -----------------USER -----------------------

// router.get('/user/search3', userController.search2);

// router.post('/user/actions/playtime', authMiddleWare.verifyToken, userController.playTime);
// router.post('/user/actions/likedsong', authMiddleWare.verifyToken, userController.likedSong);
// router.post('/user/actions/followed', authMiddleWare.verifyToken, userController.followedArtist);
// router.post('/user/actions/comment', authMiddleWare.verifyToken, userController.comment);

// router.post('/user/otp', authMiddleWare.checkEmailExits, emailController.sendOtp);
// router.post('/user/register', userController.register);
// router.post('/user/changepass', authMiddleWare.verifyToken, userController.changePassword);

// // ---------------------------------------------------

// module.exports = router;
import express from 'express';
const Router = express.Router();

import { authMiddleWare } from '~/middleware/authMiddleWare';
import { songController } from '~/controllers/songController';

// const userController = require('../controllers/userController');
// const boardValidations = require('../validations/boardValidations');
// import { registerUser } from '~/controllers/userController';
import { userValidations } from '~/validations/userValidations';
import { userController } from '~/controllers/userController';

// Định nghĩa endpoint cho đăng ký người dùng
// Router.post('/user/register', registerUser);

// Router.route('/user')
//     .get((req, res) => {
//         res.send('hẻllo');
//     })
//     .post(userValidations.registerUserValidation, userController.registerUser);

function decodeQueryString(req, res, next) {
    if (req.query && Object.keys(req.query).length > 0) {
        for (let key in req.query) {
            req.query[key] = decodeURIComponent(req.query[key]);
        }
    }
    next();
}

Router.route('/songs/weeklytopsongs').get(authMiddleWare.optionalVerifyToken, songController.getWeeklyTopSongs);
Router.route('/songs/trending').get(authMiddleWare.optionalVerifyToken, songController.getTrendingSongs);
Router.route('/songs/newRaleaseSong').get(authMiddleWare.optionalVerifyToken, songController.getNewReleaseSongs);

// Router.route('/songs/random').get();
Router.route('/songs/search').get(authMiddleWare.optionalVerifyToken, decodeQueryString, songController.search);
Router.route('/songs/searchSong').get(songController.searchSong);

Router.route('/songs').get(authMiddleWare.optionalVerifyToken, songController.getAllSong);
Router.route('/song/:id').get(authMiddleWare.optionalVerifyToken, songController.getSong);

Router.route('/songs/otherByArtist/:artistId').get(
    authMiddleWare.optionalVerifyToken,
    songController.getOtherSongByArtist,
);
Router.route('/songs/songOtherArtist/:artistId').get(
    authMiddleWare.optionalVerifyToken,
    songController.getSongOtherArtist,
);
Router.route('/songs/songSameGenre/:artistId').get(authMiddleWare.optionalVerifyToken, songController.getSongSameGenre);

Router.route('/songs/comment/:songId').get(authMiddleWare.optionalVerifyToken, songController.getCommentSong);
Router.route('/songs/comment/replies/:parentId').get(
    authMiddleWare.optionalVerifyToken,
    songController.getCommentChild,
);
// Router.route('/songs/comment/update').patch();

export default Router;
