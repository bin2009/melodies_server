const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const emailController = require('../controllers/emailController');
const Fuse = require('fuse.js');
const db = require('../models');
// middleware
const authMiddleWare = require('../middleware/authMiddleWare');

// ---------------------------SEARCH------------------------

router.get('/search2', async (req, res) => {
    const artists = await db.Artist.findAll({ order: [['createdAt', 'DESC']] });

    const dataArtist = artists.map((a) => ({ id: a.id, name: a.name }));

    const options = {
        keys: ['name'],
        threshold: 0.8,
        includeScore: true,
    };
    const fuseArtist = new Fuse(dataArtist, options);
    const resultArtist = fuseArtist.search(req.query.query);
    const combinedResults = [
        ...resultArtist.map((result) => ({ ...result.item, score: result.score, type: 'artist' })),
    ];
    res.send(combinedResults);
});

router.get('/search3', userController.search2);

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
router.get('/info', authMiddleWare.verifyToken, userController.getUser);
router.delete('/delete/:id', authMiddleWare.verifyTokenAndAdmin, userController.deleteUser);
router.patch('/update', authMiddleWare.verifyTokenUserOrAdmin, userController.updateUser);

// ---------------------------USER + EMAIL------------------------
router.post('/otp', authMiddleWare.checkEmailExits, emailController.sendOtp);
router.post('/register', userController.register);

router.post('/changepass', authMiddleWare.verifyToken, userController.changePassword);

// ---------------------------PLAYLIST------------------------

router.get('/playlist', authMiddleWare.verifyToken, userController.getPlaylist);
router.get('/playlist/detail/:playlistId', userController.getPlaylistDetail);
router.post('/playlist/create', authMiddleWare.verifyToken, userController.createPlaylist);
router.post('/playlist/addSong', authMiddleWare.verifyToken, userController.addSongPlaylist);
router.patch('/playlist/update', authMiddleWare.verifyToken, userController.updatePlaylist);
router.delete('/playlist/deleteSong', authMiddleWare.verifyToken, userController.deleteSong);
router.delete('/playlist/deletePlaylist/:playlistId', authMiddleWare.verifyToken, userController.deletePlaylist);

// ---------------------------HOME------------------------
router.get('/home', (req, res) => {
    return res.status(200).json('Admin page');
});

module.exports = router;
