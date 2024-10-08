const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../models');
const User = db.User;
const saltRounds = 10;

const getUsersService = async (userId) => {
    try {
        if (userId) {
            const user = await User.findOne({ where: { id: userId } });
            return {
                errCode: user ? 0 : 6,
                errMess: user ? 'Get user by id' : 'User not found',
                data: user,
            };
        } else {
            const users = await User.findAll();
            return {
                errCode: users.length > 0 ? 0 : 6,
                errMess: users.length > 0 ? 'Get All users' : 'No user',
                data: users,
            };
        }
    } catch (error) {
        return {
            errCode: 8,
            errMess: 'Cannot get user',
        };
    }
};

const postUserService = async (postData) => {
    try {
        const hashPass = await bcrypt.hash(postData.password, saltRounds);
        postData.password = hashPass;
        let data = await User.create(postData);
        return {
            errCode: 1,
            errMess: 'Create successful users',
            data: data,
        };
    } catch (error) {
        return {
            errCode: 8,
            errMess: 'Create new user failed',
        };
    }
};

const deleteUserService = async (userId) => {
    try {
        const data = await User.destroy({ where: { id: userId } });
        return {
            errCode: data ? 0 : 6,
            errMess: data ? 'User deleted successfully' : 'User not found',
        };
    } catch (error) {
        return {
            errCode: 8,
            errMess: 'Delete user failed',
        };
    }
};

const updateUserService = async (userId, updateData) => {
    try {
        if (Object.keys(updateData).length === 0) {
            return {
                errCode: 3,
                errMess: 'Missing data',
            };
        } else {
            const user = await User.findOne({ where: { id: userId } });
            if (user) {
                const update = await User.update(updateData, { where: { id: userId } });
                return {
                    errCode: update ? 0 : 3,
                    errMess: update ? 'User updated successfully' : 'Bad Request',
                };
            } else {
                return {
                    errCode: 6,
                    errMess: 'User not found',
                };
            }
        }
    } catch (error) {
        return {
            errCode: 8,
            errMess: 'Error server',
        };
    }
};

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
    getUsersService,
    postUserService,
    deleteUserService,
    updateUserService,
    loginService,
};
