const statusCodes = require('../utils/statusCodes');
const userService = require('../services/userService');

const emailController = require('./emailController');

// ---------------------------USER------------------------

const getAllUser = async (req, res) => {
    const response = await userService.getUsersService(req.query.offset);
    return res.status(response.errCode).json(response);
};

const getUser = async (req, res) => {
    const userId = req.params.id;
    if (!userId) {
        return res.status(400).json({
            errCode: 400,
            message: 'User id required',
        });
    }
    const response = await userService.getUserService(userId);
    return res.status(response.errCode).json(response);
};

const deleteUser = async (req, res) => {
    const userId = req.params.id;
    if (!userId) {
        return res.status(400).json({
            errCode: 400,
            message: 'User id required',
        });
    }
    const response = await userService.deleteUserService(userId);
    return res.status(response.errCode).json(response);
};

const updateUser = async (req, res) => {
    const response = await userService.updateUserService(req.body);
    console.log(req.body);
    return res.status(response.errCode).json(response);
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
    return res.status(response.errCode).json(response);
};

const likedSong = async (req, res) => {
    const response = await userService.likedSongService(req.body);
    return res.status(response.errCode).json(response);
};

const followedArtist = async (req, res) => {
    const response = await userService.followedArtistService(req.body);
    return res.status(statusCodes[response.errCode]).json(response);
};

module.exports = {
    getAllUser,
    getUser,
    updateUser,
    deleteUser,
    register,
    playTime,
    likedSong,
    followedArtist,
};
