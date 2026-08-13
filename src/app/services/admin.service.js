const User = require('../models/User');
const Task = require('../models/Task');
const notificationService = require('./notification.service');

class AdminService {
  async getUsers() {
    return User.find()
      .select('_id username email role isBanned createdAt avatar')
      .sort({ createdAt: -1 })
      .lean()
      .then(users =>
        users.map(user => ({
          ...user,
          _id: user._id.toString(),
        })),
      );
  }

  async changeRole(currentUserId, targetUserId) {
    if (currentUserId.toString() === targetUserId) {
      throw new Error('You cannot change your own role');
    }
    const user = await User.findById(targetUserId);
    if (!user) {
      throw new Error('User not found');
    }
    user.role = user.role === 'admin' ? 'user' : 'admin';
    await user.save();
    await notificationService.createNotification({
      recipient: user._id,
      sender: currentUserId,
      type: 'role',
      task: null,
      comment: null,
    });
    return user;
  }

  async toggleBan(currentUserId, targetUserId) {
    if (currentUserId.toString() === targetUserId) {
      throw new Error('You cannot ban yourself');
    }
    const user = await User.findById(targetUserId);
    if (!user) {
      throw new Error('User not found');
    }
    user.isBanned = !user.isBanned;
    await user.save();
    await notificationService.createNotification({
      recipient: user._id,
      sender: currentUserId,
      type: 'ban',
      task: null,
      comment: null,
    });
    return user;
  }

  async deleteUser(currentUserId, targetUserId) {
    if (currentUserId.toString() === targetUserId) {
      throw new Error('You cannot delete yourself');
    }
    const user = await User.findById(targetUserId);
    if (!user) {
      throw new Error('User not found');
    }
    await Task.deleteMany({
      user: targetUserId,
    });
    await User.findByIdAndDelete(targetUserId);
    return true;
  }
}

module.exports = new AdminService();
