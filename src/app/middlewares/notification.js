const notificationService = require('../services/notification.service');

const notificationMiddleware = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return next();
    }
    console.time('notificationMiddleware');
    const notifications = await notificationService.getUserNotifications(
      req.session.userId,
      10,
    );
    console.timeEnd('notificationMiddleware');
    const unreadCount = await notificationService.getUnreadCount(
      req.session.userId,
    );
    res.locals.notifications = notifications;
    res.locals.unreadCount = unreadCount;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = notificationMiddleware;
