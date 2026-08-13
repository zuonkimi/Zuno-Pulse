const taskService = require('../../../services/task.service');
const commentService = require('../../../services/comment.service');
const { buildAttachments } = require('../../../utils/fileHelpers');

class TaskController {
  async index(req, res, next) {
    try {
      const result = await taskService.getTasksPage(
        req.session.userId,
        req.query,
      );
      return res.render('pages/tasks/list', {
        tasks: result.tasks,
        activeFilter: result.filters,
        pagination: result.pagination,
        currentUrl: req.originalUrl,
        isUserTasks: true,
      });
    } catch (err) {
      next(err);
    }
  }

  async toggleLike(req, res, next) {
    try {
      const result = await taskService.toggleLike(
        req.params.id,
        req.session.userId,
      );
      return res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const result = await taskService.getHomePageData(req.session.userId);
      return res.render('pages/tasks/create', {
        tasks: result.tasks,
      });
    } catch (err) {
      next(err);
    }
  }

  async store(req, res, next) {
    try {
      const data = req.validatedBody || req.body;
      const attachments = buildAttachments(req.files);
      await taskService.createTask(req.session.userId, {
        ...data,
        deadline: data.deadline ? new Date(data.deadline) : null,
        tags: Array.isArray(data.tags)
          ? data.tags
          : [data.tags].filter(Boolean),
        attachments,
      });
      return res.redirect('/tasks');
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      await taskService.deleteTask(
        req.params.id,
        req.session.userId,
        true,
        req.user,
      );
      return res.redirect(req.body.redirectTo || '/tasks');
    } catch (err) {
      next(err);
    }
  }

  async restore(req, res, next) {
    try {
      await taskService.restoreTask(
        req.params.id,
        req.session.userId,
        req.user,
      );
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ success: true });
      }
      return res.redirect('/me/trash-tasks');
    } catch (err) {
      next(err);
    }
  }

  async forceDelete(req, res, next) {
    try {
      await taskService.deleteTask(
        req.params.id,
        req.session.userId,
        false,
        req.user,
      );
      const redirectTo = req.query.redirect || '/tasks';
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ success: true });
      }
      return res.redirect(redirectTo);
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req, res, next) {
    try {
      await taskService.toggleStatus(
        req.params.id,
        req.session.userId,
        req.user,
      );
      const redirectUrl = req.get('Referer') || '/tasks';
      return res.redirect(redirectUrl);
    } catch (err) {
      next(err);
    }
  }

  async edit(req, res, next) {
    try {
      const task = await taskService.getDetail(
        req.params.id,
        req.session.userId,
      );
      if (!task) return res.status(404).send('Task not found');
      return res.render('pages/tasks/edit', {
        task,
        redirectTo: req.query.redirect || '/tasks',
      });
    } catch (err) {
      next(err);
    }
  }

  async updateTask(req, res, next) {
    try {
      const data = req.body;
      const attachments = buildAttachments(req.files);
      const updateData = {
        title: data.title,
        description: data.description,
        tags: Array.isArray(data.tags)
          ? data.tags
          : [data.tags].filter(Boolean),
      };
      if (data.deadline) updateData.deadline = new Date(data.deadline);
      if (attachments.length > 0) updateData.attachments = attachments;
      await taskService.updateTask(
        req.params.id,
        req.session.userId,
        updateData,
        req.user,
      );
      return res.redirect(req.body.redirectTo || '/tasks');
    } catch (err) {
      next(err);
    }
  }

  async trashTasks(req, res, next) {
    try {
      const result = await taskService.getTrash(req.session.userId);
      return res.render('pages/tasks/trash-list', {
        tasks: result.tasks,
        isEmpty: result.isEmpty,
        stats: result.stats,
        isUserTrash: true,
      });
    } catch (err) {
      next(err);
    }
  }

  async showDetail(req, res, next) {
    try {
      const task = await taskService.getDetail(
        req.params.id,
        req.session.userId,
      );
      if (!task) return res.redirect('/tasks');
      const comments = await commentService.getCommentByTaskId(req.params.id);
      return res.render('pages/tasks/detail', { task, comments });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new TaskController();
