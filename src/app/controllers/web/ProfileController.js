const userService = require('../../services/user.service');

class ProfileController {
  async show(req, res, next) {
    const viewerId = req.session.userId;
    const profileUserId = req.params.userId;
    const data = await userService.getProfilePage(
      viewerId,
      profileUserId,
      req.query.keyword,
    );
    if (!data) return res.status(404).send('User not found!');
    return res.render('pages/profile/show', {
      ...data,
      currentUrl: req.originalUrl,
    });
  }

  async edit(req, res, next) {
    const viewerId = req.session.userId;
    const userId = req.params.userId;
    const user = await userService.getEditProfilePage(viewerId, userId);
    if (!user) return res.status(403).send('user is not found!');
    return res.render('pages/profile/edit', { user });
  }

  async update(req, res, next) {
    const viewerId = req.session.userId;
    const userId = req.params.userId;
    const result = await userService.updateProfilePage(
      viewerId,
      userId,
      req.body,
      req.file,
    );
    if (!result) return res.status(403).send('Forbidden');
    return res.redirect(`/profile/${userId}`);
  }
}

module.exports = new ProfileController();
