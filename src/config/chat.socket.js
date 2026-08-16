const openedConversations = new Map();
const onlineUsers = new Map();
const ConversationService = require('../app/services/features/conversation.service');

module.exports = io => {
  io.on('connection', socket => {
    // console.log('User connected:', socket.id);
    // USER ROOM
    const userId = socket.handshake.auth?.userId;
    if (userId) {
      socket.join(`user_${userId}`);
      const userKey = userId.toString();
      if (!onlineUsers.has(userKey)) {
        onlineUsers.set(userKey, new Set());
      }
      onlineUsers.get(userKey).add(socket.id);
      io.emit('user_online', {
        userId: userKey,
      });
      // console.log(`User room joined: user_${userId}`);
    }
    // CONVERSATION ROOM
    socket.on('join_conversation', conversationId => {
      if (!conversationId) return;
      socket.join(conversationId);
      const userId = socket.handshake.auth?.userId;
      if (userId) {
        openedConversations.set(userId.toString(), conversationId.toString());
      }
      // console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
    });

    socket.on('leave_conversation', conversationId => {
      if (!conversationId) return;
      socket.leave(conversationId);
      const userId = socket.handshake.auth?.userId;
      if (userId) {
        openedConversations.delete(userId.toString());
      }
      // console.log(`Socket ${socket.id} left conversation ${conversationId}`);
    });
    // DISCONNECT
    socket.on('disconnect', () => {
      const userId = socket.handshake.auth?.userId;
      if (userId) {
        const userKey = userId.toString();
        openedConversations.delete(userKey);
        const sockets = onlineUsers.get(userKey);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            onlineUsers.delete(userKey);
            io.emit('user_offline', {
              userId: userKey,
            });
          }
        }
      }
      // console.log('User disconnected:', socket.id);
    });

    socket.on('request_total_unread', async () => {
      const userId = socket.handshake.auth?.userId;
      if (!userId) return;
      const totalUnread = await ConversationService.getUnreadCount(userId);
      socket.emit('sync_total_unread', { totalUnread });
    });

    socket.on('request_online_users', () => {
      //  console.log('request_online_users', [...onlineUsers.keys()]);
      socket.emit('sync_online_users', {
        users: [...onlineUsers.keys()],
      });
    });
  });
};

module.exports.openedConversations = openedConversations;
module.exports.onlineUsers = onlineUsers;
