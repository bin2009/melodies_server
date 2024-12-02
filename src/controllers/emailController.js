const statusCodes = require('~/utils/statusCodes');
const emailService = require('../services/emailService');
const { StatusCodes } = require('http-status-codes');

const checkEmailExits = async (req, res) => {
    const response = await emailService.checkEmailExitsService(req.body.email);
    return res.status(statusCodes[response.errCode]).json(response);
};

const sendOtp = async (req, res, next) => {
    try {
        // await userz.checkUser(req.body);
        await emailService.emailOtpService(req.body.email);
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'OTP sent to your email',
        });
    } catch (error) {
        next(error);
    }
};

const verifyEmailOtp = async (email, otp) => {
    const verify = await emailService.emailVerifyOtpService(email, otp);
    return verify;
};

module.exports = {
    checkEmailExits,
    sendOtp,
    verifyEmailOtp,
};
