const express = require('express');
const router = express.Router();

const banned = require('../../app/middlewares/admin/banned');
const isAdmin = require('../../app/middlewares/admin/isAdmin');

const AdminController = require('../../app/controllers/web/admin/AdminController');
const AdminTaskController = require('../../app/controllers/web/admin/TaskController');

// GUARD
router.use(isAdmin);
router.use(banned);

// USERS
router.get('/users', AdminController.users);
router.patch('/users/:id/role', AdminController.changeRole);
router.patch('/users/:id/ban', AdminController.toggleBan);
router.delete('/users/:id', AdminController.deleteUser);

// TASKS
router.get('/tasks', AdminTaskController.index);
router.get('/tasks/:id', AdminTaskController.show);
router.post('/tasks/:id/delete', AdminTaskController.delete);
router.post('/tasks/:id/restore', AdminTaskController.restore);
router.post('/tasks/:id/force', AdminTaskController.forceDelete);
router.patch('/tasks/:id/status', AdminTaskController.toggleStatus);
router.get('/tasks/:id/edit', AdminTaskController.edit);
router.get('/trash/tasks', AdminTaskController.trash);

module.exports = router;
