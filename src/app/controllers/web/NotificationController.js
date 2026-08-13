const notificationService = require('../../services/notification.service');

class NotificationController {
  async index(req, res, next) {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.redirect('/login');
      }
      const notifications =
        await notificationService.getUserNotifications(userId);
      const unreadCount = await notificationService.getUnreadCount(userId);
      return res.render('pages/notifications', {
        notifications,
        unreadCount,
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /notifications/:id/redirect
  async redirect(req, res, next) {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.redirect('/login');
      }
      const notification = await notificationService.getUserNotificationById(
        req.params.id,
        userId,
      );
      if (!notification) {
        return res.redirect('/notifications');
      }
      // mark read
      await notificationService.markAsRead(req.params.id, userId);
      switch (notification.type) {
        case 'comment':
          return res.redirect(`/tasks/${notification.task}`);
        case 'reply':
          return res.redirect(
            `/tasks/${notification.task}#comment-${notification.comment}`,
          );
        case 'follow':
          return res.redirect(`/profile/${notification.sender?._id}`);
        case 'new_task':
          return res.redirect(`/tasks/${notification.task}`);
        case 'like_task':
          return res.redirect(`/tasks/${notification.task}`);
        case 'like_comment':
          return res.redirect(
            `/tasks/${notification.task}#comment-${notification.comment}`,
          );
        case 'role':
          return res.redirect('/admin/users');
        default:
          return res.redirect('/notifications');
      }
    } catch (err) {
      next(err);
    }
  }

  // POST /notifications/:id/read
  async markRead(req, res, next) {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.redirect('/login');
      }
      const notification = await notificationService.markAsRead(
        req.params.id,
        userId,
      );
      if (!notification) {
        return res.redirect('/notifications');
      }
      return res.redirect('back');
    } catch (err) {
      next(err);
    }
  }

  // POST /notifications/read-all
  async markAllRead(req, res, next) {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.redirect('/login');
      }
      await notificationService.markAllAsRead(userId);
      return res.redirect('/notifications');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new NotificationController();
