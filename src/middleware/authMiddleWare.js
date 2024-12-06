import jwt from 'jsonwebtoken';
import db from '~/models';
import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError';

// const jwt = require('jsonwebtoken');
// const db = require('../models');
// const User = db.User;
// const emailController = require('../controllers/emailController');

const verifyToken = (req, res, next) => {
    try {
        const token = req.headers['authorization'];
        if (!token) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Token is required');
        } else {
            const accessToken = token.split(' ')[1];
            jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
                if (err) {
                    throw new ApiError(StatusCodes.FORBIDDEN, err.message);
                }
                req.user = user;
                next();
            });
        }
    } catch (error) {
        next(error);
    }
};

const verifyTokenAndAdmin = (req, res, next) => {
    verifyToken(req, res, (err) => {
        if (err) {
            return next(err);
        }
        if (req.user && req.user.role === 'Admin') {
            next();
        } else {
            next(new ApiError(StatusCodes.FORBIDDEN, "You're not allowed"));
        }
    });
};

const optionalVerifyToken = async (req, res, next) => {
    try {
        const token = req.headers['authorization'];
        if (!token) {
            next();
        } else {
            const accessToken = token.split(' ')[1];
            jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
                if (err) {
                    throw new ApiError(StatusCodes.FORBIDDEN, err.message);
                }
                req.user = user;
                next();
            });
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
