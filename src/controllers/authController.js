const authService = require('../services/authService');
const statusCodes = require('../utils/statusCodes');

const login = async (req, res) => {
    const response = await authService.loginService(req.body);
    const { refreshToken, errCode, ...other } = response;

    if (errCode === 0) {
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false, // true nếu sử dụng HTTPS
            path: '/',
            sameSite: 'strict',
        });
    }
    return res.status(statusCodes[errCode]).json({ errCode, ...other });
};

const logout = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    res.clearCookie('refreshToken');
    const response = await authService.logoutService(refreshToken);
    return res.status(statusCodes[response.errCode]).json(response);
};

const refresh = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(401).json("you're not authenticated");
    }

    const response = await authService.refreshService(refreshToken);
    if (response.errCode === 0) {
        res.cookie('refreshToken', response.newRefreshToken, {
            httpOnly: true,
            secure: false, // true nếu bạn sử dụng HTTPS
            path: '/',
            sameSite: 'strict',
        });
        const { newRefreshToken, ...other } = response;
        return res.status(200).json({ ...other });
    } else {
        return res.status(statusCodes[response.errCode] || 500).json(response.errMess);
    }
};

module.exports = {
    login,
    logout,
    refresh,
};
