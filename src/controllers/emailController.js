import { StatusCodes } from 'http-status-codes';
import { emailService } from '~/services/emailService';
// const checkEmailExits = async (req, res) => {
//     const response = await emailService.checkEmailExitsService(req.body.email);
//     return res.status(statusCodes[response.errCode]).json(response);
// };

const sendOtp = async (req, res, next) => {
    try {
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
    try {
        const verify = await emailService.emailVerifyOtpService(email, otp);
        return verify;
    } catch (error) {
        throw error;
    }
};

export const emailController = {
    // checkEmailExits,
    sendOtp,
    verifyEmailOtp,
};
