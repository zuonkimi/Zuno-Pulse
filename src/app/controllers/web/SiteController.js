const taskService = require('../../services/task.service');
const userService = require('../../services/user.service');

class SiteController {
  // SHOW TASK PAGE
  async show(req, res, next) {
    try {
      if (!req.session.userId) {
        return res.redirect('/landing');
      }
      const result = await taskService.getTasksPage(
        req.session.userId,
        req.query,
      );
      return res.render('tasks/show', {
        tasks: result.tasks,
        activeFilter: result.filters,
        pagination: result.pagination,
        currentUrl: req.originalUrl,
      });
    } catch (err) {
      next(err);
    }
  }

  // SEARCH (Tìm kiếm tổng hợp)
  async search(req, res, next) {
    try {
      const result = await userService.search(req.query, req.session.userId);
      return res.render('pages/search', result);
    } catch (err) {
      next(err);
    }
  }

  // HOME PAGE
  async home(req, res, next) {
    try {
      if (!req.session.userId) {
        return res.redirect('/landing');
      }
      const result = await taskService.getHomePageData(req.session.userId);
      return res.render('pages/home', {
        tasks: result.tasks,
        totalTask: result.stats.total,
        doneTasks: result.stats.done,
        overdueTasks: result.stats.overdue,
        soonTasks: result.stats.soon,
        trashTask: result.stats.trash,
        emptyMessage:
          result.tasks.length === 0 ? 'Bạn chưa có công việc nào' : '',
        userId: req.session.userId,
        isHome: true,
      });
    } catch (err) {
      next(err);
    }
  }

  // LANDING PAGE
  landing(req, res) {
    return res.render('pages/landing', {
      layout: 'landing',
    });
  }

  // ROOT
  index(req, res) {
    if (!req.session.userId) {
      return res.redirect('/landing');
    }
    return res.redirect('/home');
  }
}

module.exports = new SiteController();
