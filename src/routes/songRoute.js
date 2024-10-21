const express = require('express');
const router = express.Router();
const songController = require('../controllers/songController');
const authMiddleWare = require('../middleware/authMiddleWare');

// ---------------------THEME MUSIC------------------
// kh cần phân quyền: dùng đc cho user và guest

router.get('/songs/weeklytopsongs', authMiddleWare.verifyToken, songController.getWeeklyTopSongs);
router.get('/songs/trending', authMiddleWare.verifyToken, songController.getTrendingSongs);
router.get('/songs/newRaleaseSong', authMiddleWare.verifyToken, songController.getNewReleaseSongs);
router.get('/songs/popularArtist', authMiddleWare.verifyToken, songController.getPopularArtist);

// ---------------------------SONG------------------
router.get('/songs/', authMiddleWare.verifyToken, songController.getAllSong);
router.get('/songs/:id', authMiddleWare.verifyToken, songController.getSong);
router.post('/songs/create', authMiddleWare.verifyTokenAndAdmin, songController.createSong);
router.delete('/songs/delete/:id', authMiddleWare.verifyTokenAndAdmin, songController.deleteSong);
router.patch('/songs/update', authMiddleWare.verifyTokenAndAdmin, songController.updateSong);

// ---------------------------ARTIST------------------

router.get('/artists/', authMiddleWare.verifyToken, songController.getAllArtist);
router.get('/artists/:id', authMiddleWare.verifyToken, songController.getArtist);
router.post('/artists/create', authMiddleWare.verifyTokenAndAdmin, songController.createArtist);
router.delete('/artists/delete/:id', authMiddleWare.verifyTokenAndAdmin, songController.deleteArtist);
router.patch('/artists/update', authMiddleWare.verifyTokenAndAdmin, songController.updateArtist);

// ---------------------------GENRE------------------

router.post('/genre/create', authMiddleWare.verifyTokenAndAdmin, songController.createGenre);

// ---------------------------ALBUM------------------

router.get('/album/', songController.getAllAlbum);

module.exports = router;
