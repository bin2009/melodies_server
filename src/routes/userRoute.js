const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const emailController = require('../controllers/emailController');
const authController = require('../controllers/authController');

// ---------------------------USER------------------------
// get
router.get('/users/', userController.getUsers);
router.get('/users/:id', userController.getUsers);
// delete
router.delete('/users/:id', userController.deleteUser);
// update
router.patch('/users/:id', userController.updateUser);
// create
router.post('/users/register', userController.register);

// ---------------------------EMAIL------------------------
router.post('/user/checkEmail', emailController.checkEmailExits);
router.post('/users/otp', emailController.sendOtp);

// ---------------------------AUTHENTICATION------------------------
router.post('/users/login');


// ---------------------------TEST------------------------
router.get('/test', (req,res) => {
    res.send("test ok")
})

module.exports = router;
