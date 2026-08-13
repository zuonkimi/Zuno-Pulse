const Task = require('../../models/Task');

module.exports = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).send('Task not found');
    }
    const userId = req.user?._id || req.session?.userId;
    if (!userId) {
      return res.status(401).send('Unauthorized');
    }
    const isOwner = task.author?.toString() === userId.toString();
    const isAdmin = req.user?.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).send('Forbidden');
    }
    req.task = task;
    req.user._id = userId; // optional normalize
    next();
  } catch (err) {
    next(err);
  }
};
