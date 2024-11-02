const express = require('express');
const router = express.Router();
const songController = require('../controllers/songController');
const authMiddleWare = require('../middleware/authMiddleWare');
const db = require('../models');

// ---------------------THEME MUSIC------------------
// kh cần phân quyền: dùng đc cho user và guest

router.get('/songs/weeklytopsongs', songController.getWeeklyTopSongs);
router.get('/songs/trending', songController.getTrendingSongs);
router.get('/songs/newRaleaseSong', songController.getNewReleaseSongs);

// ---------------------------RANDOM------------------

router.get('/songs/random', songController.getSongRandom);

// ---------------------------SONG------------------
router.get('/songs/', songController.getAllSong);
router.get('/songs/:id', songController.getSong);
router.post('/songs/create', authMiddleWare.verifyTokenAndAdmin, songController.createSong);
router.delete('/songs/delete/:id', authMiddleWare.verifyTokenAndAdmin, songController.deleteSong);
router.patch('/songs/update', authMiddleWare.verifyTokenAndAdmin, songController.updateSong);

// ---------------------------GENRE------------------

router.post('/genre/create', songController.createGenre);

// router.get('/album/', songController.getAllAlbum);
// router.get('/album/popular', songController.getAlbumPopular);

router.get('/data/song/all', async (req, res) => {
    const data = await db.Genre.findAll({
        attributes: ['genreId', 'name'],
    });

    // const data2 = data.map((rec) => rec.id);
    return res.status(200).json(data);
});

module.exports = router;
