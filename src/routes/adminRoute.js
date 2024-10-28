const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/home', (req, res) => {
    return res.status(200).json('Admin page');
});

module.exports = router;
