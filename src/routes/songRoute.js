const express = require('express');
const router = express.Router();
const songController = require('../controllers/songController');

router.get('/songs', songController.getSong);
// router.put('/songs/:id', )
router.delete('/songs/delete', songController.deleteSong);
router.patch('/songs/update', songController.updateSong);
router.post('/songs/create', songController.createSong);

module.exports = router;
