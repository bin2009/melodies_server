const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const emailController = require('../controllers/emailController');

// middleware
const authMiddleWare = require('../middleware/authMiddleWare');

// ---------------------------SEARCH------------------------

router.get('/search2', (req, res) => {
    res.render('search');
});

router.get('/search', userController.search);

// ---------------------------SUBSCRIPTION------------------------

router.post('/subscription', authMiddleWare.verifyToken, userController.subscription);

// ---------------------------WORKING WITH MUSIC------------------------
router.post('/actions/playtime', authMiddleWare.verifyToken, userController.playTime);
router.post('/actions/likedsong', authMiddleWare.verifyToken, userController.likedSong);
router.post('/actions/followed', authMiddleWare.verifyToken, userController.followedArtist);
router.post('/actions/comment', authMiddleWare.verifyToken, userController.comment);

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

// ---------------------------PLAYLIST------------------------

router.get('/playlist/:userId', userController.getPlaylist);
router.get('/playlist/detail/:playlistId', userController.getPlaylistDetail);
router.post('/playlist/create', authMiddleWare.verifyToken, userController.createPlaylist);

// ---------------------------HOME------------------------
router.get('/home', (req, res) => {
    return res.status(200).json('Admin page');
});

module.exports = router;
