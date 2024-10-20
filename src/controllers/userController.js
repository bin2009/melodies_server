const userService = require('../services/userService');
const statusCodes = require('../utils/statusCodes');

const emailController = require('./emailController');

const getUsers = async (req, res) => {
    const response = await userService.getUsersService(req.params.id);
    return res.status(statusCodes[response.errCode]).json(response);
};

const deleteUser = async (req, res) => {
    const userId = req.params.id;
    const response = await userService.deleteUserService(userId);
    return res.status(statusCodes[response.errCode]).json(response);
};

const updateUser = async (req, res) => {
    const response = await userService.updateUserService(req.params.id, req.body);
    return res.status(statusCodes[response.errCode]).json(response);
};

const register = async (req, res) => {
    const data = req.body;
    const checkVerify = await emailController.verifyEmailOtp(data.email, data.otp);
    if (checkVerify) {
        delete data.otp;
        const response = await userService.registerService(data);
        return res.status(statusCodes[response.errCode]).json(response);
    } else {
        return res.status(409).json({
            errCode: 7,
            errMess: 'OTP is invalid or expired',
        });
    }
};

// ---------------------------HOME------------------------

// ---------------------------WORKING WITH MUSIC------------------------
const playTime = async (req, res) => {
    const response = await userService.playTimeService(req.body);
    return res.status(statusCodes[response.errCode]).json(response);
};

const likedSong = async (req, res) => {
    const response = await userService.likedSongService(req.body);
    return res.status(statusCodes[response.errCode]).json(response);
};

const followedArtist = async (req, res) => {
    const response = await userService.followedArtistService(req.body);
    return res.status(statusCodes[response.errCode]).json(response);
};

module.exports = {
    getUsers,
    deleteUser,
    updateUser,
    register,
    playTime,
    likedSong,
    followedArtist,
};
