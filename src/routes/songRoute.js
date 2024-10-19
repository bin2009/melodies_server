const express = require('express');
const router = express.Router();
const songController = require('../controllers/songController');

router.get('/', songController.getAllSong);
router.get('/:id', songController.getSong);
router.delete('/:id', songController.deleteSong);
router.patch('/update', songController.updateSong);
router.post('/create', songController.createSong);

module.exports = router;
