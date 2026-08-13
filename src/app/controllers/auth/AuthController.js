const crypto = require('crypto');
const authService = require('../../services/auth.service');

class AuthController {
  // GET LOGIN
  login(req, res) {
    return res.render('pages/auth/login', {
      layout: 'auth',
    });
  }

  // POST LOGIN
  async loginPost(req, res, next) {
    try {
      const user = await authService.login(req.body);
      req.session.regenerate(err => {
        if (err) return next(err);
        req.session.userId = user._id.toString();
        req.session.email = user.email;
        req.session.role = user.role;
        res.redirect('/home');
      });
    } catch (err) {
      res.render('pages/auth/login', {
        layout: 'auth',
        error: err.message,
      });
    }
  }

  // GET REGISTER
  register(req, res) {
    return res.render('pages/auth/register', {
      layout: 'auth',
    });
  }

  // POST REGISTER
  async registerPost(req, res, next) {
    try {
      const user = await authService.register(req.body);
      return res.render('pages/auth/check-email', {
        layout: 'auth',
        email: user.email,
      });
    } catch (err) {
      return res.render('pages/auth/register', {
        layout: 'auth',
        error: err.message,
      });
    }
  }

  // LOGOUT
  logout(req, res) {
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.redirect('/auth/login');
    });
  }

  // VERIFY EMAIL
  async verifyEmail(req, res, next) {
    try {
      await authService.verifyEmail(req.query.token);
      return res.redirect('/auth/login');
    } catch (err) {
      next(err);
    }
  }

  // GET FORGOT PASSWORD
  forgotPassword(req, res) {
    return res.render('pages/auth/forgot-password', {
      layout: 'auth',
    });
  }

  // POST FORGOT PASSWORD
  async forgotPasswordPost(req, res) {
    try {
      await authService.forgotPassword(req.body.email);
      return res.render('pages/auth/forgot-password', {
        layout: 'auth',
        success: 'Check your email for reset link',
      });
    } catch (err) {
      return res.render('pages/auth/forgot-password', {
        layout: 'auth',
        error: err.message,
      });
    }
  }

  // GET RESET PASSWORD
  resetPassword(req, res) {
    return res.render('pages/auth/reset-password', {
      layout: 'auth',
      token: req.query.token,
    });
  }

  // POST RESET PASSWORD
  async resetPasswordPost(req, res) {
    try {
      await authService.resetPassword(req.body);
      return res.redirect('/auth/login');
    } catch (err) {
      return res.render('pages/auth/reset-password', {
        layout: 'auth',
        error: err.message,
        token: req.body.token,
      });
    }
  }

  // GOOGLE LOGIN
  async googleLogin(req, res, next) {
    try {
      const state = crypto.randomBytes(32).toString('hex');
      req.session.oauthState = state;
      const url = await authService.getGoogleAuthUrl(state);
      return res.redirect(url);
    } catch (err) {
      next(err);
    }
  }

  // GOOGLE CALLBACK
  async googleCallback(req, res, next) {
    try {
      const { code, state } = req.query;
      if (!code) {
        throw new Error('Google login failed');
      }
      if (state !== req.session.oauthState) {
        throw new Error('Invalid OAuth state');
      }
      const user = await authService.googleLoginCallback(code);
      req.session.regenerate(err => {
        if (err) return next(err);
        req.session.userId = user._id;
        req.session.email = user.email;
        return res.redirect('/home');
      });
    } catch (err) {
      next(err);
    }
  }

  //FACEBOOK LOGIN
  async facebookLogin(req, res, next) {
    try {
      const state = crypto.randomBytes(32).toString('hex');
      req.session.oauthState = state;
      const url = await authService.getFacebookAuthUrl(state);
      req.session.save(err => {
        if (err) return next(err);
        return res.redirect(url);
      });
    } catch (err) {
      next(err);
    }
  }

  //FACEBOOK CALLBACK
  async facebookCallback(req, res, next) {
    try {
      const { code, state } = req.query;
      if (!code) {
        throw new Error('Facebook Login failed');
      }
      if (!req.session.oauthState) {
        throw new Error('Session expired, try again');
      }
      if (state !== req.session.oauthState) {
        throw new Error('Invalid OAuth state');
      }
      const user = await authService.facebookLoginCallback(code);
      req.session.regenerate(err => {
        if (err) return next(err);
        req.session.userId = user._id;
        req.session.email = user.email;
        return res.redirect('/home');
      });
    } catch (err) {
      next(err);
    }
  }

  //LINE LOGIN
  async lineLogin(req, res, next) {
    try {
      const state = crypto.randomBytes(32).toString('hex');
      req.session.oauthState = state;
      const url = await authService.getLineAuthUrl(state);
      req.session.save(err => {
        if (err) return next(err);
        return res.redirect(url);
      });
    } catch (err) {
      next(err);
    }
  }

  //LINE CALLBACK
  async lineCallback(req, res, next) {
    try {
      const { code, state } = req.query;
      if (!code) {
        throw new Error('Line login failed');
      }
      if (!req.session.oauthState) {
        throw new Error('Session expired, try again');
      }
      if (state !== req.session.oauthState) {
        throw new Error('Invalid OAuth state');
      }
      const user = await authService.lineLoginCallback(code);
      req.session.regenerate(err => {
        if (err) return next(err);
        req.session.userId = user._id;
        req.session.email = user.email;
        return res.redirect('/home');
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
