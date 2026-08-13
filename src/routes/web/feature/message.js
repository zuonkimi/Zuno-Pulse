const express = require('express');
const router = express.Router();
const upload = require('../../../app/middlewares/upload');
const MessageController = require('../../../app/controllers/web/features/MessageController');

router.get('/start/:userId', MessageController.startConversation);
router.get('/dropdown', MessageController.dropdown);
router.get('/popup/:conversationId', MessageController.popup);
router.post('/read/:conversationId', MessageController.markAsRead);
router.get('/search', MessageController.searchMessage);
router.get('/', MessageController.index);
router.post('/send', upload.single('file'), MessageController.send);
router.get(
  '/:conversationId/search-message',
  MessageController.searchInConversation,
);
router.post('/star/:messageId', MessageController.star);
router.get('/:conversationId/shared-media', MessageController.sharedMedia);
router.post('/conversation/:conversationId/pin', MessageController.pin);
router.delete(
  '/conversation/:conversationId',
  MessageController.deleteConversation,
);
router.post('/recall/:messageId', MessageController.recall);
router.get('/:conversationId', MessageController.show);
router.post(
  '/upload',
  (req, res, next) => {
    upload.array('files', 20)(req, res, err => {
      if (!err) return next();

      let message = err.message;

      if (err.code === 'LIMIT_FILE_SIZE') {
        message = 'File vượt quá 10MB';
      }

      return res.status(400).json({
        success: false,
        message,
      });
    });
  },
  MessageController.upload,
);

module.exports = router;
