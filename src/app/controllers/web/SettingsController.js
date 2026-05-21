const settingsService = require('../../services/settings.service');

class SettingsController {
  async setting(req, res, next) {
    try {
      return res.render('pages/settings/index', {
        title: 'Settings',
      });
    } catch (err) {
      next(err);
    }
  }

  async password(req, res, next) {
    try {
      return res.render('pages/settings/password');
    } catch (err) {
      next(err);
    }
  }

  async changePassword(req, res, next) {
    try {
      await settingsService.changePassword(req.session.userId, req.body);
      return res.render('pages/settings/password', {
        success: 'Password changed successfully',
      });
    } catch (err) {
      return res.render('pages/settings/password', {
        error: err.message,
      });
    }
  }
}

module.exports = new SettingsController();
