const { getRedisClient } = require('../services/redisService');

const createRoom = (req, res) => {
    const roomCode = Math.random().toString(36).substring(2, 8);
    res.json({ roomCode });
};

const checkRoom = (req, res) => {
    const { roomCode } = req.params;
    // const redisClient = getRedisClient();
    // redisClient.exists(`room:${roomCode}`, (err, reply) => {
    //     if (reply === 1) {
    //         res.json({ exists: true });
    //     } else {
    //         res.json({ exists: false });
    //     }
    // });

    console.log('>>>>>check: ', roomCode);
};

const chatRoom = (req, res) => {
    res.render('chatRoom.ejs');
};

module.exports = {
    createRoom,
    checkRoom,
    chatRoom,
};
