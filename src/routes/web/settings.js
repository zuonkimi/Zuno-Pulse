const express = require('express');
const router = express.Router();

const settingsController = require('../../app/controllers/web/SettingsController');

router.get('/', settingsController.setting);
router.get('/password', settingsController.password);
router.post('/password', settingsController.changePassword);

module.exports = router;
