const express = require('express');
const router = express.Router();
const playlistController = require('../controllers/playlistController');
const authMiddleWare = require('../middleware/authMiddleWare');

router.post('/playlists', authMiddleware.verifyToken, playlistController.createPlaylist);
router.get('/playlists', authMiddleware.verifyToken, playlistController.getAllPlaylists);
router.get('/playlists/:id', authMiddleware.verifyToken, playlistController.getPlaylist);
router.put('/playlists/:id', authMiddleware.verifyToken, playlistController.updatePlaylist);
router.delete('/playlists/:id', authMiddleware.verifyToken, playlistController.deletePlaylist);
router.post('/playlists/:playlistId/songs', authMiddleware.verifyToken, playlistController.addSongToPlaylist);
router.delete('/playlists/:playlistId/songs/:songId', authMiddleware.verifyToken, playlistController.removeSongFromPlaylist);

module.exports = router;