const express = require('express');
const router = express.Router();
const playlistController = require('../controllers/playlistController');
const authMiddleWare = require('../middleware/authMiddleWare');

router.post('/playlists', authMiddleWare.verifyToken, playlistController.createPlaylist);
router.get('/playlists', authMiddleWare.verifyToken, playlistController.getAllPlaylists);
router.get('/playlists/:id', authMiddleWare.verifyToken, playlistController.getPlaylist);
router.put('/playlists/:id', authMiddleWare.verifyToken, playlistController.updatePlaylist);
router.delete('/playlists/:id', authMiddleWare.verifyToken, playlistController.deletePlaylist);
router.post('/playlists/:playlistId/songs', authMiddleWare.verifyToken, playlistController.addSongToPlaylist);
router.delete('/playlists/:playlistId/songs/:songId', authMiddleWare.verifyToken, playlistController.removeSongFromPlaylist);

module.exports = router;