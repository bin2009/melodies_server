const statusCodes = require('../utils/statusCodes');

// SERVICE
const adminService = require('../services/adminService');
const userService = require('../services/userService');

// ---------------------------USER------------------------

const getAllUser = async (req, res) => {
    const response = await userService.getUsersService(req.query.offset);
    return res.status(response.errCode).json(response);
};

const getUser = async (req, res) => {
    const userId = req.params.id;
    if (!userId) {
        return res.status(400).json({
            errCode: 400,
            message: 'User id required',
        });
    }
    const response = await userService.getUserService(userId);
    return res.status(response.errCode).json(response);
};

const deleteUser = async (req, res) => {
    const userId = req.params.id;
    if (!userId) {
        return res.status(400).json({
            errCode: 400,
            message: 'User id required',
        });
    }
    const response = await userService.deleteUserService(userId);
    return res.status(response.errCode).json(response);
};

const updateUser = async (req, res) => {
    const response = await userService.updateUserService(req.body);
    console.log(req.body);
    return res.status(response.errCode).json(response);
};

module.exports = {
    // ----------USER-----------
    getAllUser,
    getUser,
    deleteUser,
    updateUser,
};
