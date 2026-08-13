const express = require('express');
const router = express.Router();
const { validate } = require('../../app/middlewares/validate');
const taskValidateSchema = require('../../app/validator/task.validator');
const authMiddleware = require('../../app/middlewares/auth');
const manageTaskMiddleware = require('../../app/middlewares/admin/manageTask');
const upload = require('../../app/middlewares/upload');

const taskController = require('../../app/controllers/web/user/TaskController');

// LOGIN
router.use(authMiddleware);

router.get('/create', taskController.create);
router.get('/trash-list', taskController.trashTasks);

router.post(
  '/store',
  upload.array('attachments', 5),
  validate(taskValidateSchema),
  taskController.store,
);

router.get('/', taskController.index);

router.get('/:id', taskController.showDetail);
router.post('/:id/like', taskController.toggleLike);
router.patch('/:id/status', manageTaskMiddleware, taskController.updateStatus);
router.get('/:id/edit', manageTaskMiddleware, taskController.edit);
router.put(
  '/:id',
  manageTaskMiddleware,
  upload.array('attachments', 5),
  validate(taskValidateSchema),
  taskController.updateTask,
);
router.patch('/:id/restore', manageTaskMiddleware, taskController.restore);
router.delete('/:id', manageTaskMiddleware, taskController.delete);
router.delete('/:id/force', manageTaskMiddleware, taskController.forceDelete);

module.exports = router;
