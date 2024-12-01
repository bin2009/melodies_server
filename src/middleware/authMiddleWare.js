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
    try {
        verifyToken(req, res, () => {
            if (req.user && req.user.role === 'Admin') {
                next();
            } else {
                throw new ApiError(StatusCodes.FORBIDDEN, "You're not allowed");
            }
        });
    } catch (error) {
        next(error);
    }
};

const verifyTokenAndAuthorization = (req, res, next) => {
    try {
        verifyToken(req, res, () => {
            if (req.user.id == req.params.id || req.user.role === 'Admin') {
                next();
            } else {
                throw new ApiError(StatusCodes.FORBIDDEN, "You're not allowed");
            }
        });
    } catch (error) {
        next(error);
    }
};

const optionalVerifyToken = async (req, res, next) => {
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
            });
        }
    } catch (error) {
        next(error);
    }
};

const checkEmailExits = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await db.User.findOne({ where: { email: email } });
        if (user) {
            return res.status(400).json({
                errCode: 3,
                errMess: 'Email already exists',
            });
        }
        next();
    } catch (error) {
        return res.status(500).json({
            errCode: 8,
            errMess: `Internal Server Error: ${error.message}`,
        });
    }
};

export const authMiddleWare = {
    verifyToken,
    verifyTokenAndAdmin,
    verifyTokenAndAuthorization,
    optionalVerifyToken,
    checkEmailExits,
};
