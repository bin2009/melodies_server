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

const changePassword = async (req, res) => {
    const data = req.body;
    if (!data.oldPass || !data.newPass) {
        return res.status(400).json({
            errCode: 400,
            messaeg: 'Missing data',
        });
    }
    const response = await userService.changePasswordService(req.body, req.user);
    return res.status(response.errCode).json(response);
};

// ---------------------------HOME------------------------

// ---------------------------WORKING WITH MUSIC------------------------
const playTime = async (req, res) => {
    const response = await userService.playTimeService(req.body, req.user);
    return res.status(response.errCode).json(response);
};

const likedSong = async (req, res) => {
    const response = await userService.likedSongService(req.body, req.user);
    return res.status(response.errCode).json(response);
};

const followedArtist = async (req, res) => {
    const response = await userService.followedArtistService(req.body, req.user);
    return res.status(response.errCode).json(response);
};

const comment = async (req, res) => {
    const response = await userService.commentService(req.body, req.user);
    return res.status(response.errCode).json(response);
};

// ---------------------------SUBSCRIPTION------------------------

const subscription = async (req, res) => {
    console.log('hah');
    console.log(req.user, req.body.packageId);
    // return res.send('hah');
    const response = await userService.subscriptionService(req.user, req.body.packageId);
    return res.status(response.errCode).json(response);
};

const search = async (req, res) => {
    // return res.status(200).json(req.query.query);
    const response = await userService.serachService(req.query.query);
    return res.status(response.errCode).json(response);
};

// ---------------------------PLAYLIST------------------------

const getPlaylist = async (req, res) => {
    const response = await userService.getPlaylistService(req.params.userId);
    return res.status(response.errCode).json(response);
};

const getPlaylistDetail = async (req, res) => {
    const response = await userService.getPlaylistDetailService(req.params.playlistId);
    return res.status(response.errCode).json(response);
};

const createPlaylist = async (req, res) => {
    const response = await userService.createPlaylistService(req.body, req.user);
    return res.status(response.errCode).json(response);
};

module.exports = {
    getAllUser,
    getUser,
    updateUser,
    deleteUser,
    register,
    // -----------
    playTime,
    likedSong,
    followedArtist,
    comment,
    // --------------
    changePassword,
    subscription,
    // ----------
    search,
    // ---------
    getPlaylist,
    getPlaylistDetail,
    createPlaylist,
};
