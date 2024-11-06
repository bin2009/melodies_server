const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController')

router.get('/home', (req, res) => {
    return res.status(200).json('Admin page');
});


router.get('/view/create/genre', (req, res) => {
    return res.render('genre')
})

router.get('/view/create/artistGenre', (req, res) => {
    return res.render('artistGenre')
})

router.get('/allArtistName', adminController.getAllArtistName)
router.get('/allGenreName', adminController.getAllGenreName)

router.post('/create/genre', adminController.createGenre)
router.post('/create/artistGenre', adminController.createArtistGenre)

module.exports = router;
