const Notification = require('../models/Notification');

class NotificationService {
  async createNotification({ recipient, sender, type, task, comment }) {
    if (recipient.toString() === sender.toString()) {
      return null;
    }
    return await Notification.create({
      recipient,
      sender,
      type,
      task,
      comment,
    });
  }

  async getUserNotifications(userId, limit = 10) {
    return Notification.find({
      recipient: userId,
    })
      .populate('sender', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  async getUserNotificationById(id, userId) {
    return await Notification.findOne({
      _id: id,
      recipient: userId,
    })
      .populate('sender', 'name avatar')
      .lean();
  }

  async getUnreadCount(userId) {
    return Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });
  }

  async markAsRead(notificationId, userId) {
    return await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        recipient: userId,
      },
      {
        isRead: true,
      },
      {
        new: true,
      },
    );
  }

  async markAllAsRead(userId) {
    return await Notification.updateMany(
      {
        recipient: userId,
        isRead: false,
      },
      {
        isRead: true,
      },
    );
  }

  async getNotificationById(id) {
    return await Notification.findById(id)
      .populate('sender', 'name avatar')
      .lean();
  }
}

module.exports = new NotificationService();
