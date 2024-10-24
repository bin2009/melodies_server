const jwt = require('jsonwebtoken');
const db = require('../models');
const User = db.User;
const emailController = require('../controllers/emailController');

const verifyToken = (req, res, next) => {
    const token = req.headers.token;

    if (token) {
        const accessToken = token.split(' ')[1];
        jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json('Token is not valid');
            }
            req.user = user;
            next();
        });
    } else {
        return res.status(401).json("You're not authenticated");
    }
};

const verifyUser = (req, res, next) => {};

const verifyTokenAndAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        console.log(req.user);
        if (req.user.role === 'Admin') {
            next();
        } else {
            return res.status(403).json("You're not allowed");
        }
    });
};

const verifyTokenUserOrAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.id == req.params.id || req.user.role === 'Admin') {
            next();
        } else {
            return res.status(403).json("You're not allowed");
        }
    });
};

const checkEmailExits = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ where: { email: email } });
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
module.exports = {
    verifyToken,
    verifyTokenAndAdmin,
    verifyTokenUserOrAdmin,
    checkEmailExits,
};
