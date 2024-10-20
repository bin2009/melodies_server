const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const emailController = require('../controllers/emailController');

// middleware
const authMiddleWare = require('../middleware/authMiddleWare');

// ---------------------------WORKING WITH MUSIC------------------------
router.post('/playtime', authMiddleWare.verifyToken, userController.playTime);
router.post('/likedsong', authMiddleWare.verifyToken, userController.likedSong);
router.post('/followed', authMiddleWare.verifyToken, userController.followedArtist);

// ---------------------------USER------------------------
// get
router.get('/', authMiddleWare.verifyToken, userController.getUsers);
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
