const express = require('express');
const router = express.Router();
const songController = require('../controllers/songController');
const authMiddleWare = require('../middleware/authMiddleWare');

// ---------------------THEME MUSIC------------------
// kh cần phân quyền: dùng đc cho user và guest

router.get('/songs/weeklytopsongs', authMiddleWare.optionalVerifyToken, songController.getWeeklyTopSongs);
router.get('/songs/trending', authMiddleWare.optionalVerifyToken, songController.getTrendingSongs);
router.get('/songs/newRaleaseSong', authMiddleWare.optionalVerifyToken, songController.getNewReleaseSongs);

// ---------------------------RANDOM------------------

router.get('/songs/random', songController.getSongRandom);

// ---------------------------SONG------------------
router.get('/songs/search', songController.searchSong);
router.get('/songs/', authMiddleWare.optionalVerifyToken, songController.getAllSong);
router.get('/songs/:id', authMiddleWare.optionalVerifyToken, songController.getSong);
router.get('/songs/otherByArtist/:artistId', authMiddleWare.optionalVerifyToken, songController.getOtherSongByArtist);
router.get('/songs/songOtherArtist/:artistId', authMiddleWare.optionalVerifyToken, songController.getSongOtherArtist);
router.get('/songs/songSameGenre/:artistId', authMiddleWare.optionalVerifyToken, songController.getSongSameGenre);
// router.get('/song/more/:id', songController.getMoreSong);
router.post('/songs/create', authMiddleWare.verifyTokenAndAdmin, songController.createSong);
router.delete('/songs/delete/:id', authMiddleWare.verifyTokenAndAdmin, songController.deleteSong);
router.patch('/songs/update', authMiddleWare.verifyTokenAndAdmin, songController.updateSong);

// ---------------------------COMMENT------------------

router.get('/songs/comment/:songId', authMiddleWare.optionalVerifyToken, songController.getCommentSong);
router.get('/songs/comment/replies/:parentId', authMiddleWare.optionalVerifyToken, songController.getCommentChild);
router.patch('/songs/comment/update', authMiddleWare.verifyToken, songController.updateComment);

// ---------------------------GENRE------------------

router.post('/genre/create', songController.createGenre);
// router.get('/album/', songController.getAllAlbum);
// router.get('/album/popular', songController.getAlbumPopular);

router.get('/baoloc/test', authMiddleWare.optionalVerifyToken, songController.getWeeklyTopSongs2);
module.exports = router;
