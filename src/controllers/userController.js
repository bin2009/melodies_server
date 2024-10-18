const userService = require('../services/userService');
const statusCodes = require('../utils/statusCodes');

const emailController = require('./emailController');

const getUsers = async (req, res) => {
    const response = await userService.getUsersService(req.params.id);
    res.status(statusCodes[response.errCode]).json(response);
};

const deleteUser = async (req, res) => {
    const userId = req.params.id;
    const response = await userService.deleteUserService(userId);
    res.status(statusCodes[response.errCode]).json(response);
};

const updateUser = async (req, res) => {
    const response = await userService.updateUserService(req.params.id, req.body);
    res.status(statusCodes[response.errCode]).json(response);
};

const register = async (req, res) => {
    const data = req.body;
    const checkVerify = await emailController.verifyEmailOtp(data.email, data.otp);
    if (checkVerify) {
        delete data.otp;
        const response = await userService.registerService(data);
        res.status(statusCodes[response.errCode]).json(response);
    } else {
        res.status(409).json({
            errCode: 7,
            errMess: 'OTP is invalid or expired',
        });
    }
};

module.exports = {
    getUsers,
    deleteUser,
    updateUser,
    register,
};
