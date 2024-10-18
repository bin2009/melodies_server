const statusCodes = require('../utils/statusCodes');
const emailService = require('../services/emailService');

const checkEmailExits = async (req, res) => {
    const response = await emailService.checkEmailExitsService(req.body.email);
    return res.status(statusCodes[response.errCode]).json(response);
};

const sendOtp = async (req, res) => {
    const response = await emailService.emailOtpService(req.body.email);
    return res.status(statusCodes[response.errCode]).json(response);
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
