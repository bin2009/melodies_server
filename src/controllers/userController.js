const userService = require('../services/userService');
const statusCodes = require('../utils/statusCodes');

const getUsers = async (req, res) => {
    const response = await userService.getUsersService(req.params.id);
    res.status(statusCodes[response.errCode]).json(response);
};

const postUser = async (req, res) => {
    const response = await userService.postUserService(req.body);
    res.status(statusCodes[response.errCode]).json(response);
};

const deleteUser = async (req, res) => {
    const userId = req.params.id;
    const response = await userService.deleteUserService(userId);
    res.status(statusCodes[response.errCode]).json(response);
};

const updateUser = async (req, res) => {
    const response = await userService.updateUserService(req.params.id, req.body);
    res.status(statusCodes[response.errCode]).json(response);
};

const login = async (req, res) => {
    const response = await userService.loginService(req.body);
    res.status(statusCodes[response.errCode]).json(response);
};

module.exports = {
    getUsers,
    postUser,
    deleteUser,
    updateUser,
    login,
};
