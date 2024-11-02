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
router.get('/songs/', songController.getAllSong);
router.get('/songs/:id', songController.getSong);
router.post('/songs/create', authMiddleWare.verifyTokenAndAdmin, songController.createSong);
router.delete('/songs/delete/:id', authMiddleWare.verifyTokenAndAdmin, songController.deleteSong);
router.patch('/songs/update', authMiddleWare.verifyTokenAndAdmin, songController.updateSong);

// ---------------------------GENRE------------------

router.post('/genre/create', songController.createGenre);

// router.get('/album/', songController.getAllAlbum);
// router.get('/album/popular', songController.getAlbumPopular);

module.exports = router;
