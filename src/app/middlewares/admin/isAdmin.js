module.exports = function isAdmin(req, res, next) {
  const user = req.user;
  if (!user) {
    return res.status(401).send('Unauthorized');
  }
  if (user.role !== 'admin') {
    return res.status(403).send('Admin only');
  }
  next();
};
