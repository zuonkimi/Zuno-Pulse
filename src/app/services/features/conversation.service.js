const Conversation = require('../../models/features/Conversation');

class ConversationService {
  async getMyConversations(userId) {
    const currentUserId = userId.toString();
    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate('participants', 'name avatar')
      .sort({ lastMessageAt: -1 })
      .lean();
    conversations.sort((a, b) => {
      const aPinned =
        a.pinnedBy?.some(id => id.toString() === currentUserId) || false;

      const bPinned =
        b.pinnedBy?.some(id => id.toString() === currentUserId) || false;

      if (aPinned !== bPinned) {
        return bPinned - aPinned;
      }
      return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
    });
    return conversations.map(conversation => {
      const otherUser = conversation.participants.find(
        participant => participant._id.toString() !== currentUserId,
      );
      return {
        ...conversation,
        otherUser,
        unread: conversation.unreadCount?.[currentUserId] || 0,
      };
    });
  }

  async getConversationById(conversationId) {
    return await Conversation.findById(conversationId)
      .populate('participants', 'name avatar')
      .lean();
  }

  async updateLastMessage(conversationId, content) {
    return await Conversation.findByIdAndUpdate(
      conversationId,
      {
        lastMessage: content,
        lastMessageAt: new Date(),
      },
      {
        new: true,
      },
    );
  }

  async markAsRead(conversationId, userId) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return null;
    conversation.unreadCount.set(userId.toString(), 0);
    await conversation.save();
    return conversation;
  }

  async getUnreadCount(userId) {
    const conversations = await Conversation.find({
      participants: userId,
    }).lean();
    const currentUserId = userId.toString();
    return conversations.reduce((sum, conversation) => {
      const unread = conversation.unreadCount?.[currentUserId] || 0;
      return sum + (unread > 0 ? 1 : 0);
    }, 0);
  }
}

module.exports = new ConversationService();
