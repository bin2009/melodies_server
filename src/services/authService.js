const db = require('../models');
const User = db.User;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { client } = require('../services/redisService');
const { Op } = require('sequelize');

const generateAccessToken = (user) => {
    return jwt.sign({ id: user.id, role: user.role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
};

const generateRefreshToken = (user) => {
    return jwt.sign({ id: user.id, role: user.role }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
};

const loginService = async (data) => {
    try {
        const user = await User.findOne({
            where: {
                [Op.or]: [{ username: data.username }, { email: data.username }],
            },
        });
        if (!user) {
            return {
                errCode: 404,
                message: 'Wrong username or email',
            };
        }
        const validPass = await bcrypt.compare(data.password, user.password);
        if (!validPass) {
            return {
                errCode: 401,
                message: 'Wrong password',
            };
        }
        if (user && validPass) {
            // kiểm tra đã login chưa
            const checkLogin = await client.get(String(user.id));
            if (checkLogin) {
                return {
                    errCode: 409,
                    message: 'User is already logged in',
                };
            }

            // nếu chưa login
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
                errCode: 200,
                message: 'Login successful',
                role: user.role,
                direct: direct,
                accessToken: accessToken,
                refreshToken: refreshToken,
            };
        }
    } catch (error) {
        return {
            errCode: 500,
            message: `Internal Server Error: ${error.message}`,
        };
    }
    return data;
};

const refreshService = async (authorization) => {
    try {
        // truyền vào refreshtoken
        if (!authorization) {
            return {
                errCode: 401,
                message: 'Refresh token is required',
            };
        }

        const refreshToken = authorization.split(' ')[1];
        // console.log('refreshToken', refreshToken);

        const user = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        // console.log('user: ', user);

        if (!user) {
            return {
                errCode: 403,
                message: 'Invalid refresh token',
            };
        }

        // kiểm tra trong redis
        const storedRefreshToken = await client.get(String(user.id));
        if (storedRefreshToken !== refreshToken) {
            return {
                errCode: 403,
                message: 'Token is not valid',
            };
        }

        // tạo mới
        const newAccessToken = generateAccessToken(user);

        return {
            errCode: 200,
            message: 'Refresh token successful',
            accessToken: newAccessToken,
        };
    } catch (error) {
        return {
            errCode: 500,
            message: `Internal Server Error: ${error.message}`,
        };
    }
};

const logoutService = async (authorization) => {
    try {
        // truyền vào accesstoken
        if (!authorization) {
            return {
                errCode: 401,
                message: 'Access token is required',
            };
        }
        const accesstoken = authorization.split(' ')[1];
        // console.log('refreshToken', accesstoken);

        // lấy ra id từ accesstoken
        const user = jwt.verify(accesstoken, process.env.ACCESS_TOKEN_SECRET);

        // kiểm tra có refreshtoken không
        const storedRefreshToken = await client.get(String(user.id));
        if (!storedRefreshToken) {
            return {
                errCode: 404,
                message: 'No refresh token found for user',
            };
        } else {
            // xóa refreshtoken
            await client.del(String(user.id));

            // hủy accesstoken -> accesstoken hết hạn
        }

        return {
            errCode: 200,
            message: 'Loggout successful',
        };
    } catch (err) {
        return {
            errCode: 500,
            message: `Internal Server Error: ${err}`,
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
