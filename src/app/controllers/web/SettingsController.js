const settingsService = require('../../services/settings.service');
const ALLOWED_PROVIDERS = ['google', 'line', 'facebook', 'github'];

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

  async getConnectedAccounts(req, res, next) {
    try {
      const connectedAccounts = await settingsService.getConnectedAccounts(
        req.session.userId,
      );
      return res.render('pages/settings/accounts', {
        connectedAccounts,
      });
    } catch (err) {
      next(err);
    }
  }

  async connectAccount(req, res, next) {
    try {
      const userId = req.session.userId;
      const provider = req.params.provider;
      // validate provider
      if (!ALLOWED_PROVIDERS.includes(provider)) {
        return res.status(400).send('Invalid provider');
      }
      await settingsService.connectAccount(userId, provider);
      return res.redirect('/settings/accounts');
    } catch (err) {
      next(err);
    }
  }

  async disconnectAccount(req, res, next) {
    try {
      const userId = req.session.userId;
      const provider = req.params.provider;
      // validate provider
      if (!ALLOWED_PROVIDERS.includes(provider)) {
        return res.status(400).send('Invalid provider');
      }
      await settingsService.disconnectAccount(userId, provider);
      return res.redirect('/settings/accounts');
    } catch (err) {
      next(err);
    }
  }

  async getTheme(req, res, next) {
    try {
      const user = await settingsService.getTheme(req.session.userId);
      return res.render('pages/settings/theme', {
        user,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateTheme(req, res, next) {
    try {
      await settingsService.updateTheme(req.session.userId, req.body);
      const user = await settingsService.getTheme(req.session.userId);
      return res.render('pages/settings/theme', {
        success: 'Theme updated successfully',
        user,
      });
    } catch (err) {
      return res.render('pages/settings/theme', {
        error: err.message,
        user,
      });
    }
  }
}

module.exports = new SettingsController();
