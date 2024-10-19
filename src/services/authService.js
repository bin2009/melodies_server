const db = require('../models');
const User = db.User;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { client } = require('../services/redisService');

const generateAccessToken = (user) => {
    return jwt.sign({ id: user.id, admin: user.role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30s' });
};

const generateRefreshToken = (user) => {
    return jwt.sign({ id: user.id, admin: user.role }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
};

const loginService = async (data) => {
    try {
        // login bằng username hoặc email
        let user;
        if (data.username) {
            user = await User.findOne({ where: { username: data.username } });
        } else if (data.email) {
            user = await User.findOne({ where: { email: data.email } });
        }

        if (!user) {
            return {
                errCode: 6,
                errMess: 'Wrong username or email',
            };
        }
        const validPass = await bcrypt.compare(data.password, user.password);
        if (!validPass) {
            return {
                errCode: 6,
                errMess: 'Wrong password',
            };
        }
        if (user && validPass) {
            const accessToken = generateAccessToken(user);
            const refreshToken = generateRefreshToken(user);

            // lưu refresh token vào redis
            await client.setEx(String(user.id), 7 * 24 * 60 * 60, refreshToken);

            let direct;
            if (user.role === 'Admin') {
                direct = '/admin/home';
            } else if (user.role === 'User') {
                direct = '/users/home';
            }

            return {
                errCode: 0,
                errMess: 'Login successful',
                role: user.role,
                direct: direct,
                accessToken: accessToken,
                refreshToken: refreshToken,
            };
        }
    } catch (error) {
        return {
            errCode: 8,
            errMess: `Internal Server Error: ${error.message}`,
        };
    }
    return data;
};

const refreshService = async (refreshToken) => {
    try {
        if (!refreshToken) {
            return {
                errCode: 3,
                errMess: 'Refresh token is required',
            };
        }

        const user = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        if (!user) {
            return {
                errCode: 3,
                errMess: 'Invalid refresh token',
            };
        }

        // Kiểm tra refreshToken trong Redis
        const storedRefreshToken = await client.get(String(user.id));
        if (storedRefreshToken !== refreshToken) {
            return {
                errCode: 4,
                errMess: 'Token is not valid',
            };
        }

        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        // Lưu refresh token vào redis
        await client.setEx(String(user.id), 7 * 24 * 60 * 60, newRefreshToken);

        return {
            errCode: 0,
            errMess: 'Refresh token successful',
            accessToken: newAccessToken,
            newRefreshToken,
        };
    } catch (error) {
        return {
            errCode: 8,
            errMess: `Internal Server Error: ${error.message}`,
        };
    }
};

const logoutService = async (refreshToken) => {
    try {
        const user = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        await client.del(String(user.id));
        return {
            errCode: 0,
            errMess: 'Loggout successful',
        };
    } catch (err) {
        return {
            errCode: 8,
            errMess: `Internal Server Error: ${error.message}`,
        };
    }
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    loginService,
    logoutService,
    refreshService,
};
