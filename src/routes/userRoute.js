const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/', userController.getUsers);
router.get('/:id', userController.getUsers);
router.post('/', userController.postUser);
router.delete('/:id', userController.deleteUser);
router.patch('/:id', userController.updateUser);
router.post('/login', userController.login);

module.exports = router;
