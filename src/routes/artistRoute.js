const express = require('express');
const router = express.Router();
const artistController = require('../controllers/artistController');

router.get('/artist/popular', artistController.getPopularArtist);

module.exports = router;
