const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');

router.get('/create', roomController.createRoom);
router.get('/check/:roomCode', roomController.checkRoom);
router.get('/', roomController.chatRoom);

module.exports = router;
