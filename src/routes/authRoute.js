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
router.post('/otpreset', authController.getOtpResetPass);
router.post('/request-reset-password', authController.requestResetPassword);
router.post('/reset-password/:token', authController.resetPassword);
router.get('/reset/:token', authController.resetForm);

// -----------------test
router.get('/test/login', (req, res) => {
    return res.render('login');
});
router.get('/test/reset', (req, res) => {
    return res.render('reset');
});
router.post('/test/handle/login', (req, res) => {
    const { username, password } = req.body;
    console.log('Email:', username);
    console.log('Password:', password);
    return res.status(200).json({ username: username, password: password });
});

module.exports = router;
