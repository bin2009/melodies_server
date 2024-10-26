const express = require('express');
const router = express.Router();
const albumController = require('../controllers/albumController');

router.get('/:id', albumController.getAlbum);
router.get('/', albumController.getAllAlbum);

module.exports = router;
