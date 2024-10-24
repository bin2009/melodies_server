const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// middleware
const authMiddleWare = require('../middleware/authMiddleWare');

router.get('', (req, res) => {
    return res.status(200).json('auth route');
});

router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refresh);

module.exports = router;
