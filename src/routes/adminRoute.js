const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/home', (req, res) => {
    return res.status(200).json('Admin page');
});

router.get('/recentUser', adminController.getRecentUser);
router.get('/recentComment', adminController.getRecentComment);
router.get('/totalPlayAndCmtYear', adminController.getTotalPlayAndCmtYear);
router.get('/userGrowth', adminController.getUserGrowth);
router.get('/total', adminController.getTotal);
router.get('/todayBestSong', adminController.getTodayBestSong);

module.exports = router;
