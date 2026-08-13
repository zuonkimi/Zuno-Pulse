const taskService = require('../../../services/task.service');

class AdminTaskController {
  // ALL TASKS
  async index(req, res, next) {
    try {
      const result = await taskService.getTasksPage(
        req.user._id,
        req.query,
        'admin',
      );
      res.render('pages/admin/task-list', {
        tasks: result.tasks,
        isAdmin: true,
        isAdminTasks: true,
        activeFilter: result.filters,
      });
    } catch (err) {
      next(err);
    }
  }

  // DETAIL
  async show(req, res, next) {
    try {
      const task = await taskService.getDetail(req.params.id, req.user._id);
      if (!task) return res.status(404).send('Not found');
      res.render('pages/tasks/detail', {
        task,
        isAdmin: true,
      });
    } catch (err) {
      next(err);
    }
  }

  // SOFT DELETE
  async delete(req, res, next) {
    try {
      await taskService.deleteTask(req.params.id, req.user._id, true, req.user);
      return res.redirect(req.body.redirectTo || '/admin/tasks');
    } catch (err) {
      next(err);
    }
  }

  // RESTORE
  async restore(req, res, next) {
    try {
      await taskService.restoreTask(req.params.id, req.user._id, req.user);
      res.redirect('/admin/trash/tasks');
    } catch (err) {
      next(err);
    }
  }

  // FORCE DELETE
  async forceDelete(req, res, next) {
    try {
      await taskService.deleteTask(
        req.params.id,
        req.user._id,
        false,
        req.user,
      );
      res.redirect('/admin/trash/tasks');
    } catch (err) {
      next(err);
    }
  }

  // TRASH LIST
  async trash(req, res, next) {
    try {
      const result = await taskService.getTrash(req.user._id, 'admin');
      res.render('pages/admin/trash-list', {
        tasks: result.tasks,
        isAdmin: true,
        isAdminTrash: true,
      });
    } catch (err) {
      next(err);
    }
  }

  async toggleStatus(req, res, next) {
    try {
      await taskService.toggleStatus(req.params.id, req.user._id, req.user);
      res.redirect('/admin/tasks');
    } catch (err) {
      next(err);
    }
  }

  async edit(req, res, next) {
    try {
      const task = await taskService.getDetail(req.params.id, req.user._id);
      if (!task) {
        return res.status(404).send('Task not found');
      }
      return res.render('pages/tasks/edit', {
        task,
        redirectTo: '/admin/tasks',
        isAdmin: true,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AdminTaskController();
