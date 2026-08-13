module.exports = (req, res, next) => {
  if (req.user?.isBanned) {
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      return res.status(403).render('errors/banned');
    });
  }
  next();
};
