const express = require('express');
const router = express.Router();
const playlistController = require('../controllers/playlistController');
const authMiddleWare = require('../middleware/authMiddleWare');

router.post('/playlist/create', authMiddleWare.verifyToken, playlistController.createPlaylist);
router.post('/playlist/addSong', authMiddleWare.verifyToken, playlistController.addSongToPlaylist);

module.exports = router;