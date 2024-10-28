const express = require('express');
const router = express.Router();
const albumController = require('../controllers/albumController');

router.get('/more/:id', albumController.getMoreAlbum);
router.get('/', albumController.getAllAlbum);

router.get('/top', albumController.getTopAlbum);

module.exports = router;
