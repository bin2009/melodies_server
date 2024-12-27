import { StatusCodes } from 'http-status-codes';
import { authService } from '~/services/authService';
import ApiError from '~/utils/ApiError';

const login = async (req, res, next) => {
    try {
        console.log('login: ', req.body);
        const response = await authService.loginService(req.body);

        res.cookie('refreshToken', response.refreshToken, {
            httpOnly: true,
            secure: false, // true nếu sử dụng HTTPS
            path: '/',
            sameSite: 'strict',
        });
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Login success',
            ...response,
        });
    } catch (error) {
        next(error);
    }
};

const logout = async (req, res, next) => {
    try {
        const authorization = req.headers['authorization'];
        await authService.logoutService(authorization);
        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Loggout successful',
        });
    } catch (error) {
        next(error);
    }
};

const refresh = async (req, res, next) => {
    try {
        const token = req.body.token;

        if (!token) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Token is required');
        }

        const newAccessToken = await authService.verifyToken(token, true);

        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Refresh token success',
            accessToken: newAccessToken,
        });
    } catch (error) {
        next(error);
    }
};

const getOtpResetPass = async (req, res) => {
    const response = await authService.getOtpResetPassService(req.body.email);
    return res.status(response.errCode).json(response);
};

const requestResetPassword = async (req, res) => {
    const response = await authService.requestResetPasswordService(req.body.email);
    return res.status(response.errCode).json(response);
};

const resetForm = (req, res) => {
    const { token } = req.params;
    console.log(token);
    return res.render('reset', { token });
};

const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).json({
            errCode: 400,
            message: 'Passwords do not match',
        });
    }

    const response = await authService.resetPasswordService(token, password);
    if (response.errCode == 404) {
        return res.send(response.message);
    }
    return res.status(response.errCode).json(response);
};

export const authController = {
    login,
    logout,
    refresh,
    getOtpResetPass,
    requestResetPassword,
    resetForm,
    resetPassword,
};
