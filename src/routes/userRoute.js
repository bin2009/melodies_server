const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const emailController = require('../controllers/emailController');

// middleware
const authMiddleWare = require('../middleware/authMiddleWare');

// ---------------------------USER------------------------
// get
router.get('/', authMiddleWare.verifyToken, userController.getUsers);
router.get('/:id', userController.getUsers);
// delete
router.delete('/:id', userController.deleteUser);
// update
router.patch('/:id', userController.updateUser);
// create
router.post('/register', userController.register);

// ---------------------------EMAIL------------------------
router.post('/checkEmail', emailController.checkEmailExits);
router.post('/otp', emailController.sendOtp);

// ---------------------------HOME------------------------
router.get('/home', (req, res) => {
    return res.status(200).json('Admin page');
});

module.exports = router;
