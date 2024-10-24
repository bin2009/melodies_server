const express = require('express');
const router = express.Router();

// CONTROLLER
const userController = require('../controllers/userController');
const adminController = require('../controllers/adminController');

// ---------------------------USER------------------------
router.get('/alluser', adminController.getAllUser);
router.get('/user/:id', adminController.getUser);
router.patch('/user/update', adminController.updateUser);
router.delete('/user/delete', adminController.deleteUser);

module.exports = router;
