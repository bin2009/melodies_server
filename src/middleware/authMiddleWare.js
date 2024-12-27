import jwt from 'jsonwebtoken';
import db from '~/models';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError';
import { authService } from '~/services/authService';

const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers['authorization'].split(' ')[1];
        const verified = await authService.verifyToken(token, false);
        req.user = verified;
        next();
    } catch (error) {
        next(error);
    }
};

const verifyTokenAndAdmin = async (req, res, next) => {
    try {
        const token = req.headers['authorization'].split(' ')[1];
        const verified = await authService.verifyToken(token, false);

        if (verified.role === 'Admin') {
            req.user = verified;
            next();
        } else {
            throw new ApiError(StatusCodes.FORBIDDEN, "You're not allowed");
        }
    } catch (error) {
        next(error);
    }
};

const optionalVerifyToken = async (req, res, next) => {
    try {
        const token = req.headers['authorization'];

        if (!token) {
            next();
        } else {
            const accessToken = token.split(' ')[1];

            const verified = await authService.verifyToken(accessToken, false);

            req.user = verified;
            next();
        }
    } catch (error) {
        next(error);
    }
};

const checkEmailAndUsernameExits = async (req, res, next) => {
    try {
        const { email, username } = req.body;
        const checkEmail = await db.User.findOne({ where: { email: email } });
        if (checkEmail) throw new ApiError(StatusCodes.CONFLICT, 'Email already exists');
        const checkUsername = await db.User.findOne({ where: { username: username } });
        if (checkUsername) throw new ApiError(StatusCodes.CONFLICT, 'Username already exists');
        next();
    } catch (error) {
        next(error);
    }
};

export const authMiddleWare = {
    verifyToken,
    verifyTokenAndAdmin,
    optionalVerifyToken,
    checkEmailAndUsernameExits,
};
