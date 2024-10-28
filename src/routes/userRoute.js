const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const emailController = require('../controllers/emailController');

// middleware
const authMiddleWare = require('../middleware/authMiddleWare');
// ---------------------------SUBSCRIPTION------------------------

router.post('/subscription', authMiddleWare.verifyToken, userController.subscription);

// ---------------------------WORKING WITH MUSIC------------------------
router.post('/actions/playtime', authMiddleWare.verifyToken, userController.playTime);
router.post('/likedsong', authMiddleWare.verifyToken, userController.likedSong);
router.post('/followed', authMiddleWare.verifyToken, userController.followedArtist);

// ---------------------------USER------------------------
// get
router.get('/', userController.getAllUser);
router.get('/:id', authMiddleWare.verifyTokenAndAdmin, userController.getUser);
router.delete('/delete/:id', authMiddleWare.verifyTokenAndAdmin, userController.deleteUser);
router.patch('/update', authMiddleWare.verifyTokenUserOrAdmin, userController.updateUser);

// ---------------------------USER + EMAIL------------------------
router.post('/otp', authMiddleWare.checkEmailExits, emailController.sendOtp);
router.post('/register', userController.register);

router.post('/changepass', authMiddleWare.verifyToken, userController.changePassword);

// ---------------------------HOME------------------------
router.get('/home', (req, res) => {
    return res.status(200).json('Admin page');
});

module.exports = router;
