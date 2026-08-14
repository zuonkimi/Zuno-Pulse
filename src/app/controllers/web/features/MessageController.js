const MessageService = require('../../../services/features/message.service');
const ConversationService = require('../../../services/features/conversation.service');
const { formatMessages } = require('../../../utils/messageFormatter');
const Conversation = require('../../../models/features/Conversation');
const socketHandler = require('../../../../config/chat.socket');

class MessageController {
  async index(req, res, next) {
    try {
      const conversations = await ConversationService.getMyConversations(
        req.user._id,
      );
      conversations.forEach(conversation => {
        conversation.otherUser = conversation.participants.find(
          participant => participant._id.toString() !== req.user._id.toString(),
        );
        conversation.unread =
          conversation.unreadCount?.[req.user._id.toString()] || 0;
      });
      return res.render('pages/features/messages/index', {
        conversations,
      });
    } catch (err) {
      next(err);
    }
  }

  async show(req, res, next) {
    try {
      console.time('getMyConversations');
      const conversations = await ConversationService.getMyConversations(
        req.user._id,
      );
      console.timeEnd('getMyConversations');
      console.time('getConversationById');
      const conversation = await ConversationService.getConversationById(
        req.params.conversationId,
      );
      if (!conversation) {
        return res.redirect('/messages');
      }
      conversations.forEach(conversation => {
        conversation.otherUser = conversation.participants.find(
          participant => participant._id.toString() !== req.user._id.toString(),
        );
        conversation.isActive =
          conversation._id.toString() === req.params.conversationId;
        conversation.unread =
          conversation.unreadCount?.[req.user._id.toString()] || 0;
      });
      conversation.otherUser = conversation.participants.find(
        participant => participant._id.toString() !== req.user._id.toString(),
      );
      conversation.otherUser.isOnline =
        socketHandler.onlineUsers?.has(conversation.otherUser._id.toString()) ||
        false;
      if (
        !conversation.participants.some(
          participant => participant._id.toString() === req.user._id.toString(),
        )
      ) {
        return res.status(403).send('Forbidden');
      }
      const rawMessages = await MessageService.getMessages(
        req.params.conversationId,
      );
      console.timeEnd('getMessages');
      const messages = formatMessages(
        rawMessages.map(message => ({
          ...message,
          isMine: message.sender._id.toString() === req.user._id.toString(),
        })),
      );
      return res.render('pages/features/messages/index', {
        conversations,
        conversation,
        messages,
        currentUserId: req.user._id.toString(),
      });
    } catch (err) {
      next(err);
    }
  }

  async send(req, res, next) {
    try {
      const conversationId = req.body?.conversationId;
      const content = req.body?.content;
      const replyTo = req.body?.replyTo || null;
      const message = await MessageService.sendMessage({
        conversation: conversationId,
        sender: req.user._id,
        content,
        replyTo: req.body.replyTo || null,
      });
      const updatedConversation = await Conversation.findById(conversationId);
      const receiver = updatedConversation.participants.find(
        p => p.toString() !== req.user._id.toString(),
      );
      const unreadCount =
        updatedConversation.unreadCount.get(receiver.toString()) || 0;
      await message.populate('sender', 'name avatar');
      const totalUnread = await ConversationService.getUnreadCount(receiver);
      const formattedMessage = formatMessages([
        {
          ...message.toObject(),
          conversationId: conversationId.toString(),
          isMine: false,
        },
      ])[0];
      req.app
        .get('io')
        .to(conversationId.toString())
        .emit('new_message', formattedMessage);
      console.log('Emit new_message:', conversationId);
      req.app.get('io').to(`user_${receiver}`).emit('conversation_updated', {
        conversationId: conversationId.toString(),
        lastMessage: content,
        unreadCount,
        totalUnread,
        lastMessageAt: updatedConversation.lastMessageAt,
      });
      req.app
        .get('io')
        .to(`user_${req.user._id}`)
        .emit('conversation_updated', {
          conversationId: conversationId.toString(),
          lastMessage: content,
          unreadCount: 0,
          totalUnread: 0,
          lastMessageAt: updatedConversation.lastMessageAt,
        });
      await ConversationService.updateLastMessage(conversationId, content);
      return res.json({
        success: true,
      });
    } catch (err) {
      next(err);
    }
  }

  async dropdown(req, res, next) {
    try {
      const conversations = await ConversationService.getMyConversations(
        req.user._id,
      );
      const data = conversations.map(conversation => {
        const otherUser = conversation.participants.find(
          participant => participant._id.toString() !== req.user._id.toString(),
        );
        return {
          conversationId: conversation._id,
          user: {
            name: otherUser.name,
            avatar: otherUser.avatar,
          },
          lastMessage: conversation.lastMessage,
          lastMessageAt: conversation.lastMessageAt,
          unread: conversation.unreadCount?.[req.user._id.toString()] || 0,
        };
      });
      return res.json(data);
    } catch (err) {
      next(err);
    }
  }

  async popup(req, res, next) {
    try {
      const conversation = await ConversationService.getConversationById(
        req.params.conversationId,
      );
      conversation.otherUser = conversation.participants.find(
        participant => participant._id.toString() !== req.user._id.toString(),
      );
      conversation.otherUser.isOnline =
        socketHandler.onlineUsers?.has(conversation.otherUser._id.toString()) ||
        false;
      const isMember = conversation.participants.some(
        p => p._id.toString() === req.user._id.toString(),
      );
      if (!isMember) {
        return res.status(403).json({ success: false });
      }
      const rawMessages = await MessageService.getMessages(
        req.params.conversationId,
      );
      const messages = formatMessages(
        rawMessages.map(m => ({
          ...m,
          isMine: m.sender._id.toString() === req.user._id.toString(),
        })),
      );
      res.json({
        success: true,
        conversation,
        messages,
        currentUserId: req.user._id.toString(),
      });
    } catch (err) {
      next(err);
    }
  }

  async searchMessage(req, res, next) {
    try {
      const keyword = (req.query.q || '').toString().trim();
      const conversations = await ConversationService.getMyConversations(
        req.user._id,
      );
      let data = conversations.map(c => {
        const otherUser = c.participants.find(
          p => p._id.toString() !== req.user._id.toString(),
        );
        return {
          _id: c._id,
          otherUser: {
            ...otherUser,
            isOnline:
              socketHandler.onlineUsers?.has(otherUser._id.toString()) || false,
          },
          lastMessage: c.lastMessage,
          lastMessageAt: c.lastMessageAt,
          unread: c.unread || 0,
          isActive: req.params?.conversationId === c._id.toString(),
        };
      });
      if (keyword) {
        const regex = new RegExp(keyword, 'i');

        data = data.filter(c => {
          return (
            regex.test(c.otherUser?.name || '') ||
            regex.test(c.lastMessage || '')
          );
        });
      }
      // sort giống inbox
      data.sort((a, b) => {
        return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
      });
      return res.json(data);
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const conversation = await Conversation.findById(
        req.params.conversationId,
      );
      if (!conversation) {
        return res.status(404).json({
          success: false,
        });
      }
      conversation.unreadCount.set(req.user._id.toString(), 0);
      await conversation.save();
      const totalUnread = await ConversationService.getUnreadCount(
        req.user._id,
      );
      req.app.get('io').to(`user_${req.user._id}`).emit('conversation_read', {
        conversationId: conversation._id.toString(),
        totalUnread,
      });
      return res.json({
        success: true,
      });
    } catch (err) {
      next(err);
    }
  }

  async upload(req, res, next) {
    try {
      const { conversationId, content = '', replyTo = null } = req.body;
      if (!req.files || !req.files.length) {
        return res.status(400).json({
          success: false,
        });
      }
      const messages = [];
      for (const [index, file] of req.files.entries()) {
        const isImage = file.mimetype.startsWith('image/');
        const message = await MessageService.sendFileMessage({
          conversation: conversationId,
          sender: req.user._id,
          type: isImage ? 'image' : 'file',
          fileUrl: '/uploads/' + file.filename,
          fileName:
            file._originalName ??
            Buffer.from(file.originalname, 'binary').toString('utf8'),
          fileSize: file.size,
          // TEXT + EMOJI
          // chỉ gắn caption vào file đầu tiên
          content: index === 0 ? content : '',
          // REPLY chỉ gắn vào file đầu tiên
          replyTo: index === 0 ? replyTo : null,
        });
        await message.populate('sender', 'name avatar');
        messages.push(message);
      }
      const updatedConversation = await Conversation.findById(conversationId);
      const receiver = updatedConversation.participants.find(
        p => p.toString() !== req.user._id.toString(),
      );
      const unreadCount =
        updatedConversation.unreadCount.get(receiver.toString()) || 0;
      const totalUnread = await ConversationService.getUnreadCount(receiver);
      for (const message of messages) {
        const freshMessage = await MessageService.getMessageById(message._id);
        const socketMessage = {
          ...freshMessage,
          conversationId: conversationId.toString(),
          isMine:
            freshMessage.sender._id.toString() === req.user._id.toString(),
        };
        // console.log(
        //   'REALTIME MESSAGE:',
        //   JSON.stringify(socketMessage, null, 2),
        // );
        // console.log(
        //   'SERVER SOCKET CONTENT:',
        //   JSON.stringify(socketMessage.content),
        // );
        // console.log('SERVER SOCKET FULL:', socketMessage);
        req.app
          .get('io')
          .to(conversationId.toString())
          .emit('new_message', socketMessage);
      }
      req.app
        .get('io')
        .to(`user_${receiver}`)
        .emit('conversation_updated', {
          conversationId: conversationId.toString(),
          lastMessage: req.files[0].mimetype.startsWith('image/')
            ? '📷 Image'
            : '📎 File',
          unreadCount,
          totalUnread,
          lastMessageAt: updatedConversation.lastMessageAt,
        });
      req.app
        .get('io')
        .to(`user_${req.user._id}`)
        .emit('conversation_updated', {
          conversationId: conversationId.toString(),

          lastMessage: req.files[0].mimetype.startsWith('image/')
            ? '📷 Image'
            : '📎 File',
          unreadCount: 0,
          totalUnread: 0,
          lastMessageAt: updatedConversation.lastMessageAt,
        });
      return res.json({
        success: true,
      });
    } catch (err) {
      next(err);
    }
  }

  async searchInConversation(req, res, next) {
    try {
      const { conversationId } = req.params;
      const keyword = (req.query.q || '').trim();
      if (!keyword) {
        return res.json([]);
      }
      const messages = await MessageService.searchMessages(
        conversationId,
        keyword,
      );
      return res.json(messages);
    } catch (err) {
      next(err);
    }
  }

  async recall(req, res, next) {
    try {
      const message = await MessageService.recallMessage(
        req.params.messageId,
        req.user._id,
      );
      req.app
        .get('io')
        .to(message.conversation.toString())
        .emit('message_recalled', {
          messageId: message._id.toString(),
          conversationId: message.conversation.toString(),
        });
      req.app
        .get('io')
        .to(message.conversation.toString())
        .emit('conversation_updated', {
          conversationId: message.conversation.toString(),
          lastMessage: 'Tin nhắn đã được thu hồi',
          unreadCount: 0,
          totalUnread: 0,
          lastMessageAt: new Date(),
        });
      return res.json({
        success: true,
        messageId: message._id,
      });
    } catch (err) {
      next(err);
    }
  }

  async star(req, res, next) {
    try {
      const { message, starred } = await MessageService.toggleStar(
        req.params.messageId,
        req.user._id,
      );
      req.app
        .get('io')
        .to(message.conversation.toString())
        .emit('message_starred', {
          messageId: message._id.toString(),
          userId: req.user._id.toString(),
          starred,
        });
      return res.json({
        success: true,
        starred,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteConversation(req, res, next) {
    try {
      const conversation = await MessageService.deleteConversation(
        req.params.conversationId,
        req.user._id,
      );
      req.app
        .get('io')
        .to(conversation._id.toString())
        .emit('conversation_deleted', {
          conversationId: conversation._id.toString(),
        });
      return res.json({
        success: true,
      });
    } catch (err) {
      next(err);
    }
  }

  async pin(req, res, next) {
    try {
      const { conversation, pinned } = await MessageService.togglePin(
        req.params.conversationId,
        req.user._id,
      );
      req.app.get('io').to(`user_${req.user._id}`).emit('conversation_pinned', {
        conversationId: conversation._id.toString(),
        pinned,
      });
      return res.json({
        success: true,
        pinned,
      });
    } catch (err) {
      next(err);
    }
  }

  async sharedMedia(req, res, next) {
    try {
      const data = await MessageService.getSharedMedia(
        req.params.conversationId,
      );
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  async startConversation(req, res, next) {
    try {
      const myId = req.user._id;
      const otherUserId = req.params.userId;
      // 1. tìm conversation 2 người
      let conversation = await Conversation.findOne({
        participants: { $all: [myId, otherUserId] },
        $expr: { $eq: [{ $size: '$participants' }, 2] },
      });
      // 2. nếu chưa có → tạo mới
      if (!conversation) {
        conversation = await Conversation.create({
          participants: [myId, otherUserId],
          createdAt: new Date(),
        });
      }
      // 3. redirect sang trang chat
      return res.redirect(`/messages/${conversation._id}`);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new MessageController();
