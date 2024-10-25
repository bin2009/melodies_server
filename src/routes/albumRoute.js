const express = require('express');
const router = express.Router();
const albumController = require('../controllers/albumController');

router.get('/:id', albumController.getAlbum);

router.get('/', (req, res) => {
    res.send("baoloc")
})

module.exports = router;
