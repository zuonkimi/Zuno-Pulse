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
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return true;
  }
}

module.exports = new SettingsService();
