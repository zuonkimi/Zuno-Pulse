const User = require('../models/User');

module.exports = async function themeMiddleware(req, res, next) {
  try {
    if (!req.session.userId) {
      return next();
    }
    const user = await User.findById(req.session.userId).lean();
    res.locals.theme = user?.theme || 'system';
    res.locals.accentColor = user?.accentColor || '#f2f2f2';
    next();
  } catch (err) {
    next(err);
  }
};
