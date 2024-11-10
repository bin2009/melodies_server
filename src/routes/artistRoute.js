const express = require('express');
const router = express.Router();
const artistController = require('../controllers/artistController');
const authMiddWare = require('../middleware/authMiddleWare');

router.get('/artist/popular', artistController.getPopularArtist);
// ----------------------------------------------

router.get('/artist/search', artistController.searchArtist);
router.get('/artist/', artistController.getAllArtist);
router.get('/artist/:id', artistController.getArtist);
router.post('/artist/create', authMiddWare.verifyTokenAndAdmin, artistController.createArtist);
router.delete('/artist/delete/:id', authMiddWare.verifyTokenAndAdmin, artistController.deleteArtist);
router.patch('/artist/update', artistController.updateArtist);

router.get('/artist/more/:artistId', artistController.getMoreArtist);

module.exports = router;
