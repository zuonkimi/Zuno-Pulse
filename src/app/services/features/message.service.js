const Message = require('../../models/features/Message');
const Conversation = require('../../models/features/Conversation');
const socketHandler = require('../../../config/chat.socket');

class MessageService {
  async getMessages(conversationId) {
    return await Message.find({
      conversation: conversationId,
    })
      .populate('sender', 'name avatar')
      .populate('replyTo')
      .sort({ createdAt: 1 })
      .lean();
  }

  async sendMessage({ conversation, sender, content, replyTo }) {
    let replySnapshot = null;

    if (replyTo) {
      const repliedMessage = await Message.findById(replyTo);

      if (repliedMessage) {
        replySnapshot = {
          content: repliedMessage.isRecalled
            ? 'Tin nhắn đã được thu hồi'
            : repliedMessage.content ||
              (repliedMessage.type === 'image'
                ? '📷 Image'
                : repliedMessage.type === 'file'
                  ? `📎 ${repliedMessage.fileName}`
                  : ''),

          fileUrl: repliedMessage.fileUrl,
          fileName: repliedMessage.fileName,
          messageType: repliedMessage.type,
        };
      }
    }
    const message = await Message.create({
      conversation,
      sender,
      content,
      replyTo: replyTo || null,
      replySnapshot,
    });

    const conversationDoc = await Conversation.findById(conversation);

    if (!conversationDoc) {
      throw new Error('Conversation not found');
    }

    // tăng unread cho tất cả người nhận
    conversationDoc.participants.forEach(participant => {
      const participantId = participant.toString();

      if (participantId === sender.toString()) return;

      const openedConversation =
        socketHandler.openedConversations?.get(participantId);

      const isViewingConversation =
        openedConversation === conversation.toString();

      if (!isViewingConversation) {
        const currentUnread =
          conversationDoc.unreadCount.get(participantId) || 0;

        conversationDoc.unreadCount.set(participantId, currentUnread + 1);
      }
    });

    conversationDoc.lastMessage = content;
    conversationDoc.lastMessageAt = new Date();

    await conversationDoc.save();

    return await Message.findById(message._id)
      .populate('sender', 'name avatar')
      .populate('replyTo');
  }

  async markAsRead(conversationId, userId) {
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return null;
    }

    conversation.unreadCount.set(userId.toString(), 0);

    await conversation.save();

    return conversation;
  }

  async getUnreadCount(conversationId, userId) {
    const conversation = await Conversation.findById(conversationId).lean();

    if (!conversation) {
      return 0;
    }

    return conversation.unreadCount?.[userId.toString()] || 0;
  }

  async sendFileMessage(data) {
    const message = await Message.create(data);
    console.log('log database: ', await Message.findById(message._id).lean());
    const conversationDoc = await Conversation.findById(data.conversation);

    conversationDoc.participants.forEach(participant => {
      const participantId = participant.toString();

      if (participantId === data.sender.toString()) return;

      const openedConversation =
        socketHandler.openedConversations?.get(participantId);

      const isViewingConversation =
        openedConversation === data.conversation.toString();

      if (!isViewingConversation) {
        const currentUnread =
          conversationDoc.unreadCount.get(participantId) || 0;

        conversationDoc.unreadCount.set(participantId, currentUnread + 1);
      }
    });

    conversationDoc.lastMessage =
      data.type === 'image' ? '📷 Image' : '📎 File';

    conversationDoc.lastMessageAt = new Date();

    await conversationDoc.save();

    return await Message.findById(message._id).populate(
      'sender',
      'name avatar',
    );
  }

  async searchMessages(conversationId, keyword) {
    return await Message.find({
      conversation: conversationId,
      content: {
        $regex: keyword,
        $options: 'i',
      },
    })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 })
      .lean();
  }

  async recallMessage(messageId, userId) {
    const message = await Message.findById(messageId);

    if (!message) {
      throw new Error('Message not found');
    }

    if (message.sender.toString() !== userId.toString()) {
      throw new Error('No permission');
    }

    if (message.isRecalled) {
      return message;
    }

    message.isRecalled = true;
    message.recalledAt = new Date();

    await message.save();
    const conversation = await Conversation.findById(message.conversation);

    if (
      conversation &&
      conversation.lastMessage ===
        (message.content ||
          (message.type === 'image'
            ? '📷 Image'
            : message.type === 'file'
              ? '📎 File'
              : ''))
    ) {
      conversation.lastMessage = 'Tin nhắn đã được thu hồi';

      await conversation.save();
    }
    return message;
  }

  async toggleStar(messageId, userId) {
    const message = await Message.findById(messageId);

    if (!message) {
      throw new Error('Message not found');
    }

    const index = message.starredBy.findIndex(
      id => id.toString() === userId.toString(),
    );

    let starred;

    if (index === -1) {
      message.starredBy.push(userId);
      starred = true;
    } else {
      message.starredBy.splice(index, 1);
      starred = false;
    }

    await message.save();

    return {
      message,
      starred,
    };
  }

  async deleteConversation(conversationId, userId) {
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const isMember = conversation.participants.some(
      id => id.toString() === userId.toString(),
    );

    if (!isMember) {
      throw new Error('Forbidden');
    }

    await Message.deleteMany({
      conversation: conversationId,
    });

    await Conversation.deleteOne({
      _id: conversationId,
    });

    return conversation;
  }

  async togglePin(conversationId, userId) {
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const index = conversation.pinnedBy.findIndex(
      id => id.toString() === userId.toString(),
    );

    let pinned;

    if (index === -1) {
      conversation.pinnedBy.push(userId);
      pinned = true;
    } else {
      conversation.pinnedBy.splice(index, 1);
      pinned = false;
    }

    await conversation.save();

    return {
      conversation,
      pinned,
    };
  }

  async getSharedMedia(conversationId) {
    const images = await Message.find({
      conversation: conversationId,

      type: 'image',

      isRecalled: false,
    }).lean();

    const files = await Message.find({
      conversation: conversationId,

      type: 'file',

      isRecalled: false,
    }).lean();

    const links = await Message.find({
      conversation: conversationId,

      content: /https?:\/\/\S+/i,

      isRecalled: false,
    }).lean();

    return {
      images,

      files,

      links,
    };
  }
}

module.exports = new MessageService();
