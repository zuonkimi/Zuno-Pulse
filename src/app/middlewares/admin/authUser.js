const User = require('../../models/User');

module.exports = async (req, res, next) => {
  try {
    if (!req.session.userId) return next();
    const user = await User.findById(req.session.userId);
    if (!user) return next();
    // BLOCK USER BỊ BAN
    if (user.isBanned) {
      req.session.destroy();
      return res.status(403).render('errors/banned');
    }
    req.user = user;
    res.locals.user = user;
    res.locals.currentUser = user;
    next();
  } catch (err) {
    next(err);
  }
};
