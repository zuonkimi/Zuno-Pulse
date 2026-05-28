const bcrypt = require('bcrypt');
const User = require('../models/User');

class SettingsService {
  async changePassword(userId, body) {
    const { currentPassword, newPassword, confirmPassword } = body;
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    if (user.provider !== 'local') {
      throw new Error('Social accounts can not change password');
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new Error('Current password incorrect');
    }
    if (newPassword !== confirmPassword) {
      throw new Error('Passwords do not match');
    }
    if (newPassword === currentPassword) {
      throw new Error('New password must be different from current password');
    }
    const password = newPassword.trim();
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    if (password.length > 64) {
      throw new Error('Password is too long');
    }
    if (/\s/.test(password)) {
      throw new Error('Password cannot contain spaces');
    }
    if (!/[A-Z]/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      throw new Error('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      throw new Error('Password must contain at least one special character');
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return true;
  }

  async getConnectedAccounts(userId) {
    const user = await User.findById(userId).lean({ getters: true });
    if (!user) throw new Error('User not found');
    return {
      google: !!user.connectedAccounts?.google,
      line: !!user.connectedAccounts?.line,
      facebook: !!user.connectedAccounts?.facebook,
      github: !!user.connectedAccounts?.github,
    };
  }

  async connectAccount(userId, provider) {
    const user = await User.findById(userId);
    if (!user.connectedAccounts) {
      user.connectedAccounts = {};
    }
    user.connectedAccounts[provider] = true;
    await user.save();
    await user.save();
  }

  async disconnectAccount(userId, provider) {
    const user = await User.findById(userId);
    if (!user.connectedAccounts) {
      user.connectedAccounts = {};
    }
    user.connectedAccounts[provider] = false;
    await user.save();
  }

  async getTheme(userId) {
    const user = await User.findById(userId).lean();
    return {
      theme: user.theme || 'system',
      accentColor: user.accentColor || '#f2f2f2',
    };
  }

  async updateTheme(userId, body) {
    const { theme, accentColor } = body;
    const allowedThemes = ['system', 'light', 'dark'];
    if (!allowedThemes.includes(theme)) {
      throw new Error('invalid theme');
    }
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    user.theme = theme;
    user.accentColor = accentColor;
    await user.save();
    return true;
  }
}

module.exports = new SettingsService();
