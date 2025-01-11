import db from '~/models';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { client } from '~/services/redisService';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { emailService } from '~/services/emailService';
import ApiError from '~/utils/ApiError';
import { StatusCodes } from 'http-status-codes';
import { ACCOUNT_STATUS } from '~/data/enum';
const saltRounds = 10;

const TOKEN_DURATION = process.env.TOKEN_DURATION;
const REFRESH_TOKEN_DURATION = process.env.REFRESH_TOKEN_DURATION;

const generateAccessToken = (user) => {
    return jwt.sign(
        { id: user.id, role: user.role, username: user.username, accountType: user.accountType, jti: uuidv4() },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: parseInt(TOKEN_DURATION),
        },
    );
};

const verifyToken = async (token, isRefresh) => {
    try {
        const verified = jwt.decode(token, process.env.ACCESS_TOKEN_SECRET);

        if (!verified) {
            throw new ApiError(StatusCodes.UNAUTHORIZED, 'Token is invalid');
        }

        const checkToken = await client.get(verified.jti);

        if (checkToken) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Token is blacklisted');
        }

        if (!isRefresh) {
            if (verified.exp * 1000 <= Date.now()) {
                throw new ApiError(StatusCodes.UNAUTHORIZED, 'Token is expired');
            }

            return verified;
        } else {
            if ((verified.iat + parseInt(REFRESH_TOKEN_DURATION)) * 1000 <= Date.now()) {
                throw new ApiError(StatusCodes.FORBIDDEN, 'Refresh token has expired, please log in again');
            }

            await client.setEx(String(verified.jti), parseInt(TOKEN_DURATION), String(verified.jti));

            const user = await db.User.findByPk(verified.id);

            if (!user) {
                throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
            }

            const newAccessToken = generateAccessToken(user);

            return newAccessToken;
        }
    } catch (error) {
        // console.log('verifyToken: ', error);
        throw error;
    }
};

const loginService = async (data) => {
    try {
        const user = await db.User.findOne({
            where: {
                [Op.or]: [{ username: data.username }, { email: data.username }],
            },
        });
        if (!user) throw new ApiError(StatusCodes.BAD_REQUEST, 'Incorrect login information');

        const validPass = await bcrypt.compare(data.password, user.password);
        if (!validPass) throw new ApiError(StatusCodes.BAD_REQUEST, 'Incorrect login information');

        if (user && validPass) {
            if (user.status !== 'NORMAL') {
                const message = ACCOUNT_STATUS[user.status];
                throw new ApiError(StatusCodes.FORBIDDEN, `Your account has been: ${message}`);
            }

            const accessToken = generateAccessToken(user);

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
            };
        }
    } catch (error) {
        throw error;
    }
};

const refreshService = async (token) => {
    try {
        const verified = await verifyToken(token, true);

        const user = await db.User.findByPk(verified.id);

        if (!user) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
        }

        const iat = verified.iat;
        const expiryTime = iat + parseInt(REFRESH_TOKEN_DURATION);

        if (Date.now() >= expiryTime * 1000) {
            throw new ApiError(StatusCodes.FORBIDDEN, 'Unauthenticated');
        }

        const accessToken = generateAccessToken(user);
        return accessToken;
    } catch (error) {
        throw error;
    }
};

const logoutService = async (authorization) => {
    try {
        const accesstoken = authorization.split(' ')[1];

        const user = jwt.verify(accesstoken, process.env.ACCESS_TOKEN_SECRET);

        const exp = user.exp;

        const currentTime = Math.floor(Date.now() / 1000);
        const timeToExpire = exp - currentTime;

        await client.setEx(String(user.jti), timeToExpire, String(user.jti));
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

        const token = generateAccessToken(user);

        // const resetLink = `http://localhost:20099/api/auth/reset/${token}`;
        const resetLink = `https://www.pbl6melodies.me/api/auth/reset/${token}`;

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
        const userToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
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
        console.log('resetPasswordService: ', error);
        return {
            errCode: 500,
            message: `Request reset passworđ failed: ${error.message}`,
        };
    }
};

export const authService = {
    generateAccessToken,
    verifyToken,
    loginService,
    logoutService,
    refreshService,
    getOtpResetPassService,
    requestResetPasswordService,
    resetPasswordService,
};
