module.exports = (req, res, next) => {
  if (!req.session.userId) {
    if (req.originalUrl.startsWith('/api')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    return res.redirect('/login');
  }
  next();
};
