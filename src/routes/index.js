const usersRouter = require('./web/users');
const adminRouter = require('./web/admin');
const tasksRouter = require('./web/tasks');
const siteRouter = require('./web/site');
const authRouter = require('./web/auth');
const profileRouter = require('./web/profile');
const settingsRouter = require('./web/settings');
const messageRouter = require('./web/feature/message');
const webNotificationRouter = require('./web/notification');
const followRouter = require('./api/follow');
const commentRouter = require('./api/comment');
const apiNotificationRouter = require('./api/notification');
const requireAuth = require('../app/middlewares/auth');
const preventCache = require('../app/middlewares/preventCache');
const notificationMiddleware = require('../app/middlewares/notification');
const messageMiddleware = require('../app/middlewares/features/messageDropdown');
const themeMiddleware = require('../app/middlewares/theme');
const authUserMiddleware = require('../app/middlewares/admin/authUser');

function route(app) {
  // GLOBAL USER
  app.use(authUserMiddleware);
  // GLOBAL THEME
  app.use(themeMiddleware);
  // GLOBAL NOTIFICATIONS
  app.use(notificationMiddleware);
  // GLOBAL MESSAGES
  app.use(messageMiddleware);
  // PUBLIC
  app.use('/auth', authRouter);
  // API
  app.use('/api/comments', requireAuth, preventCache, commentRouter);
  app.use('/api/follow', requireAuth, preventCache, followRouter);
  app.use(
    '/api/notifications',
    requireAuth,
    preventCache,
    apiNotificationRouter,
  );
  // WEB
  app.use('/tasks', requireAuth, preventCache, tasksRouter);
  app.use('/profile', profileRouter);
  app.use('/settings', requireAuth, preventCache, settingsRouter);
  app.use('/messages', requireAuth, preventCache, messageRouter);
  app.use('/notifications', requireAuth, preventCache, webNotificationRouter);
  app.use('/users', usersRouter);
  app.use('/admin', requireAuth, preventCache, adminRouter);
  // HOME
  app.use('/', siteRouter);
}

module.exports = route;
