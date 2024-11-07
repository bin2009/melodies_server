const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/home', (req, res) => {
    return res.status(200).json('Admin page');
});

router.get('/view/create/genre', (req, res) => {
    return res.render('genre');
});

router.get('/view/create/artistGenre', (req, res) => {
    return res.render('artistGenre');
});

router.get('/allArtistName', adminController.getAllArtistName);
router.get('/allGenreName', adminController.getAllGenreName);

router.post('/create/genre', adminController.createGenre);
router.post('/create/artistGenre', adminController.createArtistGenre);

router.get('/recentUser', adminController.getRecentUser);
router.get('/recentComment', adminController.getRecentComment);
router.get('/totalPlayAndCmtYear', adminController.getTotalPlayAndCmtYear);
router.get('/userGrowth', adminController.getUserGrowth);
router.get('/total', adminController.getTotal);
router.get('/todayBestSong', adminController.getTodayBestSong);

router.get('/allSong', adminController.getAllSong);
router.get('/songDetail/:songId', adminController.getSongDetail);
router.patch('/update/song', adminController.updateSong);
router.post('/create/song', adminController.createSong);

module.exports = router;
