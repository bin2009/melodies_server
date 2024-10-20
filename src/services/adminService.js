const db = require('../models');
const User = db.User;
const bcrypt = require('bcryptjs');
const saltRounds = 10;

const createService = async (data) => {
    try {
        const hashPass = await bcrypt.hash(data.password, saltRounds);
        data.password = hashPass;
        data.role = 'Admin';
        data.statusPassword = false;
        data.accountType = 'Premium';
        data.status = true;
        const newUser = await User.create(data);
        return {
            errCode: 0,
            errMess: 'Admin created successfully',
        };
    } catch (error) {
        return {
            errCode: 8,
            errMess: `Admin creation failed: ${error.message}`,
        };
    }
};

module.exports = {
    createService,
};
