const jwt = require('jsonwebtoken');

const db = require('../models');
const User = db.User;

const generalAccessToken = (data) => {
    const access_token = jwt.sign(data, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1m' });
    return access_token;
};

const generalRefreshToken = (data) => {
    const refresh_token = jwt.sign(data, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '365d' });
    return refresh_token;
};

const loginService = async (data) => {
    // check email exits
    try {
        const user = await User.findOne({ where: { email: data.email } });
        if (!user) {
            return {
                errCode: 2,
                errMess: 'Email does not exist',
            };
        }
        // Validate password
        const isPasswordValid = await bcrypt.compare(data.password, user.password);
        if (!isPasswordValid) {
            return {
                errCode: 3,
                errMess: 'Incorrect password',
            };
        }
        // Step 3: Generate JWT token
        const access_token = generalAccessToken({ id: user.id, email: user.email });
        const refresh_token = generalRefreshToken({ id: user.id, email: user.email });
        console.log('access: ', access_token);
        console.log('refresh_token: ', refresh_token);
        // Step 4: Return response with token and user information
        return {
            errCode: 1,
            errMess: 'Login successful',
            user: user,
            access_token: access_token,
            refresh_token: refresh_token,
        };
    } catch (error) {
        return {
            errCode: 8,
            errMess: `Internal server error: ${error.message}`,
        };
    }
};

module.exports = {
    loginService,
};
