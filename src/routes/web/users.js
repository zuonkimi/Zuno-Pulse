const express = require('express');
const router = express.Router();

const usersController = require('../../app/controllers/web/user/UserController');

router.get('/', usersController.index);

module.exports = router;
