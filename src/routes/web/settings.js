const express = require('express');
const router = express.Router();

const settingsController = require('../../app/controllers/web/SettingsController');

router.get('/', settingsController.setting);

router.get('/password', settingsController.password);
router.post('/password', settingsController.changePassword);

router.get('/accounts', settingsController.getConnectedAccounts);
router.post('/accounts/connect/:provider', settingsController.connectAccount);
router.post(
  '/accounts/disconnect/:provider',
  settingsController.disconnectAccount,
);

router.get('/theme', settingsController.getTheme);
router.post('/theme', settingsController.updateTheme);

module.exports = router;
