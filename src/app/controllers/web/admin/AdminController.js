const adminService = require('../../../services/admin.service');

class AdminController {
  async users(req, res, next) {
    try {
      const users = await adminService.getUsers();
      res.render('pages/admin/users-manage', {
        title: 'Manage Users',
        users,
        currentUserId: req.user._id.toString(),
        isAdmin: true,
        isUsers: true,
      });
    } catch (err) {
      next(err);
    }
  }

  async changeRole(req, res, next) {
    try {
      await adminService.changeRole(req.user._id, req.params.id);
      res.redirect('/admin/users');
    } catch (err) {
      next(err);
    }
  }

  async toggleBan(req, res, next) {
    try {
      await adminService.toggleBan(req.user._id, req.params.id);
      res.redirect('/admin/users');
    } catch (err) {
      next(err);
    }
  }

  async deleteUser(req, res, next) {
    try {
      await adminService.deleteUser(req.user._id, req.params.id);
      res.redirect('/admin/users');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AdminController();
