const bcrypt = require('bcryptjs');
const saltRounds = 10;

const db = require('../models');
const User = db.User;

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

const registerService = async (data) => {
    try {
        const hashPass = await bcrypt.hash(data.password, saltRounds);
        data.password = hashPass;
        data.role = 'User';
        data.statusPassword = false;
        data.accountType = 'Free';
        data.status = true;
        const newUser = await User.create(data);
        return {
            errCode: 0,
            errMess: 'User created successfully',
        };
    } catch (error) {
        return {
            errCode: 8,
            errMess: `User creation failed: ${error.message}`,
        };
    }
};

module.exports = {
    getUsersService,
    deleteUserService,
    updateUserService,
    registerService,
};
