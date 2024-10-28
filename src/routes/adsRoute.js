const express = require('express');
const router = express.Router();
const adsController = require('../controllers/adsController');

router.get('/random', adsController.getRandomAds);
router.get('/:id', adsController.getAds);
router.post('/impression/:id', adsController.impression);

module.exports = router;
