const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const emailController = require('../controllers/emailController');

// middleware
const authMiddleWare = require('../middleware/authMiddleWare');

// ---------------------------WORKING WITH MUSIC------------------------
router.post('/actions/playtime',  userController.playTime);
router.post('/likedsong',  userController.likedSong);
router.post('/followed',  userController.followedArtist);

// ---------------------------USER------------------------
// get
router.get('/', userController.getUsers);
router.get('/:id', authMiddleWare.verifyTokenAndAdmin, userController.getUsers);
// delete
router.delete('/:id', authMiddleWare.verifyTokenAndAdmin, userController.deleteUser);
// update
router.patch('/:id', authMiddleWare.verifyTokenUserOrAdmin, userController.updateUser);
// create
router.post('/register', userController.register);

// ---------------------------EMAIL------------------------
router.post('/checkEmail', emailController.checkEmailExits);
router.post('/otp', authMiddleWare.checkEmailExits, emailController.sendOtp);

// ---------------------------HOME------------------------
router.get('/home', (req, res) => {
    return res.status(200).json('Admin page');
});

module.exports = router;
