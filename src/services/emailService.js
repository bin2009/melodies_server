const nodemailer = require('nodemailer');
const crypto = require('crypto');

// redis
const { client } = require('./redisService');

const db = require('../models');
const User = db.User;

const generateOtp = () => {
    return crypto.randomInt(100000, 999999);
};

const sendOtp = async (email, otp) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP code is ${otp}`,
    };

    await transporter.sendMail(mailOptions);
};

const emailOtpService = async (email) => {
    const otp = generateOtp();
    try {
        await sendOtp(email, otp);
        await client.setEx(String(email), 300, String(otp));
        return {
            errCode: 0,
            errMess: 'OTP sent to your email',
        };
    } catch (error) {
        return {
            errCode: 8,
            errMess: `Internal server error: ${error.message}`,
        };
    }
};

const emailVerifyOtpService = async (email, inputOtp) => {
    try {
        const storedOtp = await client.get(String(email));
        if (!storedOtp) {
            return false;
        }
        if (storedOtp !== inputOtp) {
            return false;
        }
        return true;
    } catch (error) {
        return false;
    }
};

const checkEmailExitsService = async (email) => {
    try {
        const result = await User.findOne({ where: { email: email } });
        if (result) {
            return {
                errCode: 0,
                errMess: 'Email already exists',
            };
        }
        return {
            errCode: 0,
            errMess: 'Valid email',
        };
    } catch (error) {
        return {
            errCode: 8,
            errMess: 'Internal server error',
        };
    }
};

module.exports = {
    checkEmailExitsService,
    emailOtpService,
    emailVerifyOtpService,
};
