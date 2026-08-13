const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    if (req.session.userId) {
      const user = await User.findById(req.session.userId).lean();
      req.user = user;
      res.locals.currentUser = user;
      res.locals.isAdmin = user?.role === 'admin';
      res.locals.path = req.path;
    } else {
      req.user = null;
      res.locals.currentUser = null;
      res.locals.isAdmin = false;
      res.locals.path = req.path;
    }
  } catch (err) {
    req.user = null;
    res.locals.currentUser = null;
    res.locals.isAdmin = false;
    res.locals.path = req.path;
  }
  next();
};
