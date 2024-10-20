const adminService = require('../services/adminService');
const statusCodes = require('../utils/statusCodes');

const create = async (req, res) => {
    const response = await adminService.createService(req.body);
    return res.status(statusCodes[response.errCode]).json(response);
};

module.exports = {
    create,
};
