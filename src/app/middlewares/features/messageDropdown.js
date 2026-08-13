const ConversationService = require('../../services/features/conversation.service');

const MessageMiddleware = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }
    console.time('messageMiddleware');
    const conversations = await ConversationService.getMyConversations(
      req.user._id,
    );
    console.timeEnd('messageMiddleware');
    const currentUserId = req.user._id.toString();

    conversations.forEach(conversation => {
      conversation.otherUser = conversation.participants.find(
        participant => participant._id.toString() !== currentUserId,
      );

      conversation.unread = conversation.unreadCount?.[currentUserId] || 0;
    });

    const totalUnread = conversations.reduce((sum, conversation) => {
      return sum + (conversation.unread > 0 ? 1 : 0);
    }, 0);

    res.locals.messageDropdown = conversations;
    res.locals.messageUnreadCount = totalUnread;
  } catch (err) {
    console.error('MessageMiddleware Error:', err);
  }

  next();
};

module.exports = MessageMiddleware;
