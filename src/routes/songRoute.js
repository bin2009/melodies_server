const express = require('express');
const router = express.Router();
const songController = require('../controllers/songController');
const authMiddleWare = require('../middleware/authMiddleWare');

// ---------------------THEME MUSIC------------------
// kh cần phân quyền: dùng đc cho user và guest

router.get('/songs/weeklytopsongs', songController.getWeeklyTopSongs);
router.get('/songs/trending', songController.getTrendingSongs);
router.get('/songs/newRaleaseSong', songController.getNewReleaseSongs);
router.get('/songs/popularArtist', songController.getPopularArtist);

// ---------------------------SONG------------------
router.get('/songs/', songController.getAllSong);
router.get('/songs/:id', songController.getSong);
router.post('/songs/create', authMiddleWare.verifyTokenAndAdmin, songController.createSong);
router.delete('/songs/delete/:id', authMiddleWare.verifyTokenAndAdmin, songController.deleteSong);
router.patch('/songs/update', authMiddleWare.verifyTokenAndAdmin, songController.updateSong);

// ---------------------------ARTIST------------------

router.get('/artists/', songController.getAllArtist);
router.get('/artists/:id', authMiddleWare.verifyToken, songController.getArtist);
router.post('/artists/create', authMiddleWare.verifyTokenAndAdmin, songController.createArtist);
router.delete('/artists/delete/:id', authMiddleWare.verifyTokenAndAdmin, songController.deleteArtist);
router.patch('/artists/update', authMiddleWare.verifyTokenAndAdmin, songController.updateArtist);

// ---------------------------GENRE------------------

router.post('/genre/create', songController.createGenre);

// ---------------------------ALBUM------------------

// router.get('/album/', songController.getAllAlbum);
// router.get('/album/popular', songController.getAlbumPopular);

module.exports = router;
