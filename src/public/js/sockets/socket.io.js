const socket = io({
  auth: {
    userId: window.currentUserId,
  },
});
window.socket = socket;
function formatConversationTime(date) {
  if (!date) return '';
  const now = Date.now();
  const target = new Date(date).getTime();
  const diff = Math.floor((now - target) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) {
    return `${Math.floor(diff / 60)} minutes`;
  }
  if (diff < 86400) {
    return `${Math.floor(diff / 3600)} hours`;
  }
  if (diff < 604800) {
    return `${Math.floor(diff / 86400)} days`;
  }
  return new Date(date).toLocaleDateString('ja-JP', {
    month: '2-digit',
    day: '2-digit',
  });
}
// CONNECT
socket.on('connect', () => {
  console.log('Connected:', socket.id);
  console.log('emit request_online_users');
  socket.emit('request_online_users');
  if (window.conversationId) {
    socket.emit('join_conversation', window.conversationId);
  }
});
// HEADER BADGE
function updateHeaderMessageBadge(count) {
  console.log('updateHeaderMessageBadge:', count);
  const messageBtn = document.querySelector('.message-dropdown .nav-icon-btn');
  if (!messageBtn) return;
  let badge = messageBtn.querySelector('.notification-badge');
  if (!count || count <= 0) {
    if (badge) badge.remove();
    return;
  }
  if (!badge) {
    badge = document.createElement('span');
    badge.className = 'notification-badge';
    messageBtn.appendChild(badge);
  }
  badge.textContent = count > 99 ? '99+' : count;
}
// SEND MESSAGE
const form = document.getElementById('messageForm');
const input = document.getElementById('messageInput');
const sendBtn = form?.querySelector('.send-btn');
let isSending = false;
if (form) {
  form.addEventListener('submit', async e => {
    e.preventDefault();
    // Chặn double click / double submit
    if (isSending) return;
    const content = input.value.trim();
    if (!content && !selectedFiles.length) return;
    isSending = true;
    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.classList.add('sending');
    }
    try {
      const formData = new FormData();
      formData.append('conversationId', window.conversationId);
      formData.append('content', content);
      if (replyMessage?.id) {
        formData.append('replyTo', replyMessage.id);
      }
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });
      let url;
      if (selectedFiles.length > 0) {
        url = '/messages/upload';
      } else {
        url = '/messages/send';
      }
      const res = await fetch(url, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        throw new Error(`Send failed: ${res.status}`);
      }
      const data = await res.json().catch(() => null);
      // RESET
      replyMessage = null;
      if (replyPreview) {
        replyPreview.style.display = 'none';
        replyPreview.innerHTML = '';
      }
      input.value = '';
      input.style.height = 'auto';
      selectedFiles = [];
      if (fileInput) {
        fileInput.value = '';
      }
      if (previewBox) {
        previewBox.innerHTML = '';
      }
      input.focus();
    } catch (err) {
      console.error('SEND MESSAGE ERROR:', err);
      showError('Unable to send the message. Please try again');
    } finally {
      // Quan trọng:
      // chỉ mở khóa SAU KHI request hoàn thành
      isSending = false;
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.classList.remove('sending');
      }
    }
  });
}
// NEW MESSAGE
socket.on('new_message', message => {
  console.log('PAGE SOCKET:', message);
  function escapeHtml(str = '') {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  const chatBody = document.querySelector('.chat-body');
  console.log('chatBody=', chatBody);
  if (!chatBody) return;
  const msgConversationId =
    message.conversationId || message.conversation?._id || message.conversation;
  // console.log('current=', window.conversationId);
  // console.log('incoming=', msgConversationId);
  if (String(window.conversationId) !== String(msgConversationId)) {
    return;
  }
  const isMine =
    message.sender?._id?.toString() === window.currentUserId?.toString();
  const time = new Date(message.createdAt).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });
  let replyHtml = '';
  if (message.replySnapshot) {
    let previewText = message.replySnapshot.content;
    if (!previewText) {
      if (message.replySnapshot.messageType === 'image') {
        previewText = '📷 Image';
      } else if (message.replySnapshot.messageType === 'file') {
        previewText = `📎 ${message.replySnapshot.fileName || 'File'}`;
      }
    }
    replyHtml = `
    <div class="reply-message-preview"
         data-reply-id="${message.replyTo?._id || message.replyTo}">
      ${escapeHtml(previewText)}
    </div>
  `;
  }
  let bubbleHtml = '';
  if (message.isRecalled) {
    bubbleHtml = `
    <i class="recalled-message">
      Message has been recalled
    </i>
  `;
  } else {
    // IMAGE
    if (message.type === 'image' && message.fileUrl) {
      bubbleHtml += `
      <img
        src="${message.fileUrl}"
        class="chat-image js-chat-image"
        data-image-url="${message.fileUrl}"
        alt="${escapeHtml(message.fileName || 'Image')}"
        loading="lazy"
      />
    `;
    }
    // FILE
    if (message.type === 'file' && message.fileUrl) {
      bubbleHtml += `
      <a
        href="${message.fileUrl}"
        target="_blank"
        rel="noopener noreferrer"
        class="chat-file"
      >
        <i class="bi bi-file-earmark-pdf-fill"></i>
        <span>${escapeHtml(message.fileName || 'File')}</span>
        <i class="bi bi-box-arrow-up-right"></i>
      </a>
    `;
    }
    // TEXT + EMOJI
    if (message.content) {
      bubbleHtml += `
      <div class="message-text">
        ${escapeHtml(String(message.content))}
      </div>
    `;
    }
  }
  const actionsHtml = `
<div class="msg-actions">
  <button
    class="msg-menu-btn"
    data-message-id="${message._id}"
  >
    <i class="bi bi-three-dots"></i>
  </button>
  <div
    class="msg-menu"
    data-menu-id="${message._id}"
  >
    <button class="msg-action reply">
      Reply
    </button>
    <button class="msg-action forward">
      Forward
    </button>
<button
  class="msg-action star"
  data-starred="false"
>
  ⭐ Star
</button>
    <button class="msg-action recall">
      Recall
    </button>
  </div>
</div>
`;
  const html = isMine
    ? `
<div class="msg mine">
  <div class="msg-content">
    <div
      class="msg-bubble"
      data-message-id="${message._id}"
    >
      ${replyHtml}
      ${bubbleHtml}
    </div>
    <div class="msg-time">
      ${time}
    </div>
  </div>
  ${actionsHtml}
</div>
`
    : `
<div class="msg">
  <img
    class="msg-avatar"
    src="${message.sender.avatar}"
  />
  <div class="msg-content">
    <div
      class="msg-bubble"
      data-message-id="${message._id}"
    >
      ${replyHtml}
      ${bubbleHtml}
    </div>
    <div class="msg-time">
      ${time}
    </div>
  </div>
  ${actionsHtml}
</div>
`;
  chatBody.insertAdjacentHTML('beforeend', html);
  chatBody.querySelectorAll('.reply-message-preview').forEach(preview => {
    if (preview.dataset.bound) return;
    preview.dataset.bound = '1';
    preview.addEventListener('click', () => {
      const targetId = preview.dataset.replyId;
      if (!targetId) return;
      const target = document.querySelector(`[data-message-id="${targetId}"]`);
      if (!target) return;
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      target.classList.add('reply-highlight');
      setTimeout(() => {
        target.classList.remove('reply-highlight');
      }, 2000);
    });
  });
  chatBody.scrollTop = chatBody.scrollHeight;
});
// CONVERSATION UPDATED
socket.on('conversation_updated', data => {
  const {
    conversationId,
    unreadCount,
    totalUnread,
    lastMessage,
    lastMessageAt,
  } = data;
  updateHeaderMessageBadge(totalUnread);
  const formattedTime = formatConversationTime(lastMessageAt);
  // DROPDOWN
  const card = document.querySelector(
    `.message-card[data-conversation-id="${conversationId}"]`,
  );
  if (card) {
    // realtime last message
    const last = card.querySelector('.message-last');
    if (last) {
      last.textContent = lastMessage || '';
    }
    // realtime time
    const time = card.querySelector('.message-time');
    if (time) {
      time.textContent = formattedTime;
    }
    // đưa conversation mới nhất lên đầu
    const list = card.parentNode;
    if (list) {
      list.prepend(card);
    }
    const isCurrentConversation =
      window.conversationId &&
      window.conversationId.toString() === conversationId.toString();
    if (!isCurrentConversation && unreadCount > 0) {
      card.classList.add('unread');
      let dot = card.querySelector('.message-unread-dot');
      if (!dot) {
        dot = document.createElement('span');
        dot.className = 'message-unread-dot';
        const bottom = card.querySelector('.message-bottom');
        if (bottom) {
          bottom.appendChild(dot);
        }
      }
    } else {
      card.classList.remove('unread');
      const dot = card.querySelector('.message-unread-dot');
      if (dot) {
        dot.remove();
      }
    }
  }
  // MESSAGE PAGE
  const item = document.querySelector(
    `.conversation-item[href="/messages/${conversationId}"]`,
  );
  if (!item) return;
  const isActive =
    window.conversationId &&
    window.conversationId.toString() === conversationId.toString();
  const last = item.querySelector('.last');
  if (last) {
    last.textContent = lastMessage || '';
  }
  const time = item.querySelector('.conversation-time');
  if (time) {
    time.textContent = formattedTime;
  }
  if (isActive) {
    item.classList.remove('unread');
    const oldBadge = item.querySelector('.conversation-badge');
    if (oldBadge) {
      oldBadge.remove();
    }
    const parent = item.parentNode;
    if (parent) {
      parent.prepend(item);
    }
    return;
  }
  item.classList.add('unread');
  let badge = item.querySelector('.conversation-badge');
  if (!badge) {
    badge = document.createElement('div');
    badge.className = 'conversation-badge';
    const bottom = item.querySelector('.conversation-bottom');
    if (bottom) {
      bottom.appendChild(badge);
    }
  }
  badge.textContent = unreadCount;
  const parent = item.parentNode;
  if (parent) {
    parent.prepend(item);
  }
});
// CONVERSATION READ
socket.on('conversation_read', data => {
  const item = document.querySelector(
    `.conversation-item[href="/messages/${data.conversationId}"]`,
  );
  if (!item) return;
  item.classList.remove('unread');
  const badge = item.querySelector('.conversation-badge');
  if (badge) badge.remove();
  const card = document.querySelector(
    `.message-card[data-conversation-id="${data.conversationId}"]`,
  );
  if (card) {
    card.classList.remove('unread');
    const dot = card.querySelector('.message-unread-dot');
    if (dot) dot.remove();
  }
  // IMPORTANT: luôn trust server value
  updateHeaderMessageBadge(data.totalUnread ?? 0);
});
socket.on('sync_online_users', data => {
  // reset status trước
  document.querySelectorAll('.popup-status').forEach(el => {
    el.textContent = 'Offline';
  });
  document.querySelectorAll('.chat-status').forEach(el => {
    el.textContent = 'Offline';
  });
  // bật lại những user online
  data.users.forEach(userId => {
    document.querySelectorAll(`[data-online-dot="${userId}"]`).forEach(dot => {
      dot.style.display = 'block';
    });
    document
      .querySelectorAll(`.popup-status[data-popup-user-id="${userId}"]`)
      .forEach(el => {
        el.innerHTML = `
          <span class="status-dot"></span>
          Online
        `;
      });
    document
      .querySelectorAll(`.chat-status[data-chat-user-id="${userId}"]`)
      .forEach(el => {
        el.innerHTML = `
      <span class="status-dot"></span>
      Online
    `;
      });
  });
});

socket.on('user_online', data => {
  document
    .querySelectorAll(`[data-online-dot="${data.userId}"]`)
    .forEach(dot => {
      dot.style.display = 'block';
    });
  document
    .querySelectorAll(`.popup-status[data-popup-user-id="${data.userId}"]`)
    .forEach(el => {
      el.innerHTML = `
        <span class="status-dot"></span>
        Online
      `;
    });
  document
    .querySelectorAll(`.chat-status[data-chat-user-id="${data.userId}"]`)
    .forEach(el => {
      el.innerHTML = `
      <span class="status-dot"></span>
      Online
    `;
    });
});

socket.on('user_offline', data => {
  document
    .querySelectorAll(`[data-online-dot="${data.userId}"]`)
    .forEach(dot => {
      dot.style.display = 'none';
    });
  document
    .querySelectorAll(`.popup-status[data-popup-user-id="${data.userId}"]`)
    .forEach(el => {
      el.innerHTML = `Offline`;
    });
  document
    .querySelectorAll(`.chat-status[data-chat-user-id="${data.userId}"]`)
    .forEach(el => {
      el.textContent = 'Offline';
    });
});

socket.on('message_recalled', data => {
  const bubble = document.querySelector(
    `[data-message-id="${data.messageId}"]`,
  );
  const msg = bubble?.closest('.msg');
  const actions = msg?.querySelector('.msg-actions');
  if (actions) {
    actions.remove();
  }
  if (!bubble) return;
  bubble.innerHTML = `
    <i>Message has been recalled</i>
  `;
});

socket.on('message_starred', data => {
  const bubble = document.querySelector(
    `[data-message-id="${data.messageId}"]`,
  );
  if (!bubble) return;
  let star = bubble.querySelector('.message-star');
  if (data.starred) {
    if (!star) {
      star = document.createElement('div');
      star.className = 'message-star';
      star.textContent = '⭐';
      bubble.prepend(star);
    }
  } else {
    if (star) {
      star.remove();
    }
  }
  const menu = document.querySelector(
    `.msg-menu[data-menu-id="${data.messageId}"]`,
  );
  if (menu) {
    const btn = menu.querySelector('.msg-action.star');
    if (btn) {
      btn.dataset.starred = data.starred;
      btn.innerHTML = data.starred ? '⭐ Unstar' : '⭐ Star';
    }
  }
});

socket.on('conversation_deleted', data => {
  document
    .querySelector(
      `.conversation-item[href="/messages/${data.conversationId}"]`,
    )
    ?.remove();
  document
    .querySelector(
      `.message-card[data-conversation-id="${data.conversationId}"]`,
    )
    ?.remove();
  if (window.conversationId && window.conversationId === data.conversationId) {
    location.href = '/messages';
  }
});

function sortConversationList() {
  const container = document.querySelector('.conversation-items');
  if (!container) return;
  const items = [...container.querySelectorAll('.conversation-item')];
  items.sort((a, b) => {
    const aPinned = a.dataset.pinned === 'true';
    const bPinned = b.dataset.pinned === 'true';
    // Pinned always on top
    if (aPinned !== bPinned) {
      return bPinned - aPinned;
    }
    // Same pin status then sort by time
    return Number(b.dataset.time) - Number(a.dataset.time);
  });
  items.forEach(item => container.appendChild(item));
}

socket.on('conversation_pinned', data => {
  const btn = document.getElementById('pinConversationBtn');
  if (btn) {
    btn.dataset.pinned = data.pinned;
    btn.innerHTML = data.pinned ? 'Unpin' : 'Pin';
  }
  const item = document.querySelector(
    `.conversation-item[data-conversation-id="${data.conversationId}"]`,
  );
  if (!item) return;
  item.dataset.pinned = data.pinned;
  const pinIcon = item.querySelector('.pin-icon');
  if (pinIcon) {
    pinIcon.style.display = data.pinned ? 'inline' : 'none';
  }
  sortConversationList();
});
