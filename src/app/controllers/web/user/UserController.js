const userService = require('../../../services/user.service');

class UserController {
  async index(req, res, next) {
    try {
      const users = await userService.getUsersWithFollowState(
        req.session.userId,
      );
      return res.render('pages/users/users-list', { users, isUsers: true });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController();
