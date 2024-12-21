import db from '~/models';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { client } from '~/services/redisService';
import { Op } from 'sequelize';
import { emailService } from '~/services/emailService';
import ApiError from '~/utils/ApiError';
import { StatusCodes } from 'http-status-codes';
import { ACCOUNT_STATUS } from '~/data/enum';
const saltRounds = 10;

const generateAccessToken = (user) => {
    return jwt.sign(
        { id: user.id, role: user.role, username: user.username, accountType: user.accountType },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: '1d',
        },
    );
};

const generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user.id, role: user.role, username: user.username, accountType: user.accountType },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: '7d',
        },
    );
};

const generateToken = (user) => {
    return jwt.sign({ id: user.id }, process.env.TOKEN_SECRET, { expiresIn: '1d' });
};

const loginService = async (data) => {
    try {
        const user = await db.User.findOne({
            where: {
                [Op.or]: [{ username: data.username }, { email: data.username }],
            },
        });
        if (!user) throw new ApiError(StatusCodes.BAD_REQUEST, 'Wrong username or email');

        const validPass = await bcrypt.compare(data.password, user.password);
        if (!validPass) throw new ApiError(StatusCodes.UNAUTHORIZED, 'Wrong password');

        if (user && validPass) {
            // kiểm tra active
            if (user.status !== 'NORMAL') {
                const message = ACCOUNT_STATUS[user.status];
                throw new ApiError(StatusCodes.FORBIDDEN, `Your account has been: ${message}`);
            }

            // kiểm tra đã login chưa
            // const checkLogin = await client.get(String(user.id));
            // if (checkLogin) throw new ApiError(StatusCodes.UNAUTHORIZED, 'User is already logged in');

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
                role: user.role,
                direct: direct,
                accountType: user.accountType,
                accessToken: accessToken,
                refreshToken: refreshToken,
            };
        }
    } catch (error) {
        throw error;
    }
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
        throw error;
    }
};

const logoutService = async (authorization) => {
    try {
        const accesstoken = authorization.split(' ')[1];

        // lấy ra id từ accesstoken
        const user = jwt.verify(accesstoken, process.env.ACCESS_TOKEN_SECRET);

        // kiểm tra có refreshtoken không
        const storedRefreshToken = await client.get(String(user.id));
        if (!storedRefreshToken) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'No refresh token found for user');
        } else {
            // xóa refreshtoken
            await client.del(String(user.id));
        }
    } catch (error) {
        throw error;
    }
};

const getOtpResetPassService = async (email) => {
    try {
        const user = await db.User.findOne({ where: { email: email } });

        if (!user) {
            return {
                errCode: 404,
                message: 'User not found',
            };
        }

        await emailService.emailOtpService(email);
        return {
            errCode: 200,
            message: 'Please check your email for otp to reset password',
        };
    } catch (error) {
        return {
            errCode: 500,
            message: `Send otp reset password failed: ${error.message}`,
        };
    }
};

const requestResetPasswordService = async (email) => {
    try {
        const user = await db.User.findOne({ where: { email: email } });

        if (!user) {
            return {
                errCode: 404,
                message: 'User not found',
            };
        }

        const token = generateToken(user);

        const resetLink = `http://localhost:2009/api/auth/reset/${token}`;

        const respone = await emailService.emailResetPasswordService(email, resetLink);
        return respone;
    } catch (error) {
        return {
            errCode: 500,
            message: `Request reset passworđ failed: ${error.message}`,
        };
    }
};

const resetPasswordService = async (token, password) => {
    try {
        const userToken = jwt.verify(token, process.env.TOKEN_SECRET);
        const user = await db.User.findByPk(userToken.id);
        if (!user) {
            return {
                errCode: 404,
                message: 'User not found',
            };
        }
        const hashPass = await bcrypt.hash(password, saltRounds);
        await db.User.update({ password: hashPass }, { where: { id: user.id } });
        return {
            errCode: 200,
            message: 'Reset password success',
        };
    } catch (error) {
        return {
            errCode: 500,
            message: `Request reset passworđ failed: ${error.message}`,
        };
    }
};

export const authService = {
    generateAccessToken,
    generateRefreshToken,
    loginService,
    logoutService,
    refreshService,
    getOtpResetPassService,
    requestResetPasswordService,
    resetPasswordService,
};
