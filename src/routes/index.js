const usersRouter = require('./web/users');
const tasksRouter = require('./web/tasks');
const siteRouter = require('./web/site');
const meRouter = require('./web/me');
const authRouter = require('./web/auth');
const profileRouter = require('./web/profile');
const settingsRouter = require('./web/settings');
const webNotificationRouter = require('./web/notification');
const followRouter = require('./api/follow');
const commentRouter = require('./api/comment');
const apiNotificationRouter = require('./api/notification');
const requireAuth = require('../app/middlewares/auth');
const preventCache = require('../app/middlewares/preventCache');
const notificationMiddleware = require('../app/middlewares/notification');
const themeMiddleware = require('../app/middlewares/theme');

function route(app) {
  //public
  app.use('/auth', authRouter);
  //private
  app.use(notificationMiddleware);
  app.use('/api/comments', requireAuth, preventCache, commentRouter);
  app.use('/api/follow', requireAuth, preventCache, followRouter);
  app.use(
    '/api/notifications',
    requireAuth,
    preventCache,
    apiNotificationRouter,
  );
  app.use(themeMiddleware);
  app.use('/tasks', requireAuth, preventCache, tasksRouter);
  app.use('/me', requireAuth, preventCache, meRouter);
  app.use('/profile', profileRouter);
  app.use('/settings', requireAuth, preventCache, settingsRouter);
  app.use('/notifications', webNotificationRouter);
  app.use('/users', usersRouter);

  //home
  app.use('/', siteRouter);
}

module.exports = route;
