const express = require('express');
const router = express.Router();
const songController = require('../controllers/songController');
const authMiddleWare = require('../middleware/authMiddleWare');

// ---------------------THEME MUSIC------------------
// kh cần phân quyền: dùng đc cho user và guest

router.get('/weeklytopsongs', songController.getWeeklyTopSongs);
router.get('/trending', songController.getTrendingSongs);
router.get('/newRaleaseSong', songController.getNewReleaseSongs);

// ---------------------------SONG------------------
router.get('/', songController.getAllSong);
router.get('/:id', songController.getSong);
router.delete('/:id', songController.deleteSong);
router.patch('/update', songController.updateSong);
router.post('/create', songController.createSong);

module.exports = router;
