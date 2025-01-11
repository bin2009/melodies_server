// const nodemailer = require('nodemailer');
// const crypto = require('crypto');
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import ejs from 'ejs';
import path from 'path';

// redis
const { client } = require('./redisService');

// const db = require('../models');
import db from '~/models';
const User = db.User;

const generateOtp = () => {
    return crypto.randomInt(10000, 99999);
};

let transporter;
try {
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASSWORD,
        },
    });
} catch (error) {
    throw error;
}

const sendOtp = async (email, otp) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Your OTP Code',
            text: `Your OTP code is ${otp}`,
        };
        await transporter.sendMail(mailOptions);
    } catch (error) {
        throw error;
    }
};

const sendResetPasswordLink = async (email, link) => {
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
        subject: 'Reset password',
        text: `Please click on link to reset password: ${link}`,
    };

    await transporter.sendMail(mailOptions);
};

const emailResetPasswordService = async (email, link) => {
    try {
        await sendResetPasswordLink(email, link);
        return {
            errCode: 200,
            errMess: 'Password reset link sent to your email',
        };
    } catch (error) {
        return {
            errCode: 500,
            errMess: `Internal server error: ${error.message}`,
        };
    }
};

const emailOtpService = async (email) => {
    const otp = generateOtp();
    console.log('otp: ', otp);
    try {
        await sendOtp(email, otp);
        await client.setEx(String(email), 60, String(otp));
    } catch (error) {
        throw error;
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
        throw error;
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

const emailNotiLockAccount = async ({ email, username, time } = {}) => {
    try {
        const htmlContent = await ejs.renderFile(path.join('/root/melodies_server/src/views/templates', 'lockAccount.ejs'), {
            username: username,
            duration: time,
        });

        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: '🚫 Notice - Your Account Has Been Suspended',
            html: htmlContent,
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        throw error;
    }
};

const emailWarnAccount = async ({ email, username } = {}) => {
    try {
        // const htmlContent = await ejs.renderFile(path.join(__dirname, '..', 'views/templates', 'warnAccount.ejs'), {
        const htmlContent = await ejs.renderFile(path.join('/root/melodies_server/src/views/templates', 'warnAccount.ejs'), {
            username: username,
        });

        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: '⚠️ Account Warning - Community Guidelines Violation',
            html: htmlContent,
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        throw error;
    }
};

// module.exports = {
//     checkEmailExitsService,
//     emailOtpService,
//     emailVerifyOtpService,
//     emailResetPasswordService,
//     emailNotiLockAccount,
// };

export const emailService = {
    checkEmailExitsService,
    emailOtpService,
    emailVerifyOtpService,
    emailResetPasswordService,
    emailNotiLockAccount,
    emailWarnAccount,
};
