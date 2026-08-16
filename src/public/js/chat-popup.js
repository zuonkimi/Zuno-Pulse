let popupMessageHandler = null;
let popupRecallHandler = null;
let lastPopupDate = null;
let popupSearchResults = [];
let popupSearchIndex = -1;
let popupSearchKeyword = '';

async function openChatPopup(conversationId, name, avatar, otherUserId) {
  // console.log('otherUserId:', otherUserId);
  function escapeHtml(str = '') {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  if (
    window.openConversationId &&
    window.openConversationId !== conversationId
  ) {
    socket.emit('leave_conversation', window.openConversationId);
  }
  window.openConversationId = conversationId;
  if (!socket.connected) {
    socket.once('connect', () => {
      socket.emit('join_conversation', conversationId);
    });
  } else {
    socket.emit('join_conversation', conversationId);
  }
  const res = await fetch(`/messages/popup/${conversationId}`);
  if (!res.ok) return;
  const data = await res.json();
  if (!data.success) return;
  const currentUserId = data.currentUserId;
  await markAsRead(conversationId);
  const container = document.getElementById('chatPopups');
  if (!container) return;
  let selectedFiles = [];
  let replyMessage = null;
  let isSending = false;
  // reset state mỗi lần mở popup
  lastPopupDate = null;
  const messagesHtml = data.messages
    .map(m => {
      const dateBlock = m.showDate
        ? `<div class="popup-date-label">${m.dateLabel}</div>`
        : '';
      return `
        ${dateBlock}
        <div class="popup-msg ${m.isMine ? 'mine' : ''}">
          ${
            !m.isMine
              ? `<img class="msg-avatar" src="${m.sender.avatar}" />`
              : ''
          }
          <div class="popup-content">
  ${
    !m.isRecalled
      ? `
      <div class="popup-msg-actions">
        <button
          class="popup-msg-menu-btn"
          data-message-id="${m._id}"
        >
          <i class="bi bi-three-dots"></i>
        </button>
        <div
          class="popup-msg-menu"
          data-menu-id="${m._id}"
        >
          <button class="popup-action reply">
            Reply
          </button>
          ${
            m.isMine
              ? `
                <button class="popup-action recall">
                  Recall
                </button>
              `
              : ''
          }
        </div>
      </div>
    `
      : ''
  }
  <div
    class="popup-bubble"
    data-message-id="${m._id}"
  >
    ${renderPopupBubble(m, escapeHtml)}
  </div>
            <div class="popup-time">
  ${
    m.time ||
    new Date(m.createdAt).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }
</div>
          </div>
        </div>
      `;
    })
    .join('');
  if (data.messages.length) {
    const lastMessage = data.messages[data.messages.length - 1];
    lastPopupDate = new Date(lastMessage.createdAt).toDateString();
  }
  container.innerHTML = `
    <div class="chat-popup">
<button
  type="button"
  class="scroll-to-bottom-btn"
>
  <i class="bi bi-arrow-down"></i>
</button>
      <div class="chat-popup-header">
  <!-- LEFT: USER INFO -->
  <div class="popup-user">
    <div class="popup-avatar-wrapper">
      <img src="${avatar}" />
      <span
        class="online-dot"
        data-online-dot="${otherUserId}"
        style="display:none"
      ></span>
    </div>
    <div class="popup-user-info">
      <div class="popup-name">${name}</div>
      <div
        class="popup-status"
        data-popup-user-id="${otherUserId}"
      >
        Offline
      </div>
    </div>
  </div>
  <!-- RIGHT: ACTIONS -->
  <div class="popup-header-actions">
  <button type="button" class="popup-search-btn">
  <i class="bi bi-search"></i>
  </button>
  <button type="button" class="popup-header-menu-btn">
    <i class="bi bi-three-dots-vertical"></i>
  </button>
  <div class="popup-header-menu">
    <button class="popup-header-action pin">
   📌 
    Pin
    </button>
    <button class="popup-header-action delete">
      🗑 Delete Conversation
    </button>
  </div>
    <button type="button" class="close-popup">
      <i class="bi bi-x-lg"></i>
    </button>
  </div>
      </div>
      <div
    class="popup-search-bar"
    style="display:none"
>
    <input
        class="popup-search-input"
        placeholder="Search message..."
    />
    <button
        type="button"
        class="popup-search-prev"
    >
        ▲
    </button>
    <button
        type="button"
        class="popup-search-next"
    >
        ▼
    </button>
    <div class="popup-search-meta">
  <span class="popup-search-count">0 / 0</span>
  <button type="button" class="popup-search-clear">
    <i class="bi bi-x-lg"></i>
  </button>
</div>
</div>
      <div class="chat-popup-body">
        ${messagesHtml}
      </div>
<div class="popup-image-lightbox" id="popupImageLightbox">
  <button type="button" class="popup-lightbox-close">
    <i class="bi bi-x-lg"></i>
  </button>
  <img id="popupLightboxImg" src="" alt="" />
</div>
      <form class="chat-popup-footer">
      <div class="popup-error"></div>
      <div
  class="reply-preview"
  style="display:none"
></div>
      <div class="popup-preview"></div>
      <div class="popup-emoji-container"></div>
      <div class="popup-input-row">
  <div class="chat-tools">
    <button type="button" class="tool-btn">
      <i class="bi bi-paperclip"></i>
    </button>
    <button
  type="button"
  class="tool-btn popup-emoji-btn"
>
  <i class="bi bi-emoji-smile"></i>
</button>
    </div>
    <textarea
    class="popup-input"
    rows="1"
    placeholder="Type a message..."
    ></textarea>
    <input type="file" id="popupFileInput" multiple hidden />
  <button
    type="submit"
    class="popup-send-btn"
  >
    <i class="bi bi-send-fill"></i>
  </button>
</div>
</form>
    </div>
  `;
  const popupStatus = container.querySelector('.popup-status');
  if (popupStatus) {
    popupStatus.innerHTML = `
    <span class="status-dot"></span>
    Online
  `;
  }
  setTimeout(() => {
    socket.emit('request_online_users');
  }, 50);
  const body = container.querySelector('.chat-popup-body');
  const scrollBtn = container.querySelector('.scroll-to-bottom-btn');
  const input = container.querySelector('.popup-input');
  const sendBtn = container.querySelector('.popup-send-btn');
  const footerForm = container.querySelector('.chat-popup-footer');
  const popupLightbox = container.querySelector('#popupImageLightbox');
  const popupLightboxImg = container.querySelector('#popupLightboxImg');
  const popupLightboxClose = container.querySelector('.popup-lightbox-close');
  body.addEventListener('click', e => {
    const img = e.target.closest('.chat-image');
    if (!img) return;
    popupLightboxImg.src = img.src;
    popupLightbox.classList.add('active');
  });
  popupLightboxClose?.addEventListener('click', () => {
    popupLightbox.classList.remove('active');
    popupLightboxImg.src = '';
  });
  popupLightbox?.addEventListener('click', e => {
    if (e.target === popupLightbox) {
      popupLightbox.classList.remove('active');
      popupLightboxImg.src = '';
    }
  });
  // theo dõi khi footer đổi chiều cao
  const footerObserver = new ResizeObserver(() => {
    updateScrollButtonPosition();
  });
  footerObserver.observe(footerForm);
  // set vị trí ban đầu
  const fileInput = container.querySelector('#popupFileInput');
  const attachBtn = container.querySelector('.bi-paperclip')?.closest('button');
  const previewBox = container.querySelector('.popup-preview');
  const errorBox = container.querySelector('.popup-error');
  const emojiBtn = container.querySelector('.popup-emoji-btn');
  const emojiContainer = container.querySelector('.popup-emoji-container');
  const replyPreview = container.querySelector('.reply-preview');
  const searchBtn = container.querySelector('.popup-search-btn');
  const searchBar = container.querySelector('.popup-search-bar');
  const searchInput = container.querySelector('.popup-search-input');
  const searchPrev = container.querySelector('.popup-search-prev');
  const searchNext = container.querySelector('.popup-search-next');
  const searchCount = container.querySelector('.popup-search-count');
  const searchClear = container.querySelector('.popup-search-clear');
  const headerMenuBtn = container.querySelector('.popup-header-menu-btn');
  const headerMenu = container.querySelector('.popup-header-menu');
  headerMenuBtn?.addEventListener('click', e => {
    e.stopPropagation();
    headerMenu.classList.toggle('show');
  });
  document.addEventListener('click', e => {
    if (headerMenu?.contains(e.target) || headerMenuBtn?.contains(e.target))
      return;
    headerMenu?.classList.remove('show');
  });
  searchClear?.addEventListener('click', () => {
    popupSearchResults = [];
    popupSearchIndex = -1;
    popupSearchKeyword = '';
    searchInput.value = '';
    searchCount.textContent = '0 / 0';
    container
      .querySelectorAll('.search-highlight')
      .forEach(el => el.classList.remove('search-highlight'));
    searchInput.focus();
  });
  searchNext?.addEventListener('click', () => {
    if (!popupSearchResults.length) return;
    popupSearchIndex++;
    if (popupSearchIndex >= popupSearchResults.length) {
      popupSearchIndex = 0;
    }
    updateSearchResult();
  });
  searchPrev?.addEventListener('click', () => {
    if (!popupSearchResults.length) return;
    popupSearchIndex--;
    if (popupSearchIndex < 0) {
      popupSearchIndex = popupSearchResults.length - 1;
    }
    updateSearchResult();
  });
  function updateScrollButtonPosition() {
    scrollBtn.style.bottom = footerForm.offsetHeight + 12 + 'px';
  }
  body.addEventListener('scroll', () => {
    const distanceFromBottom =
      body.scrollHeight - body.scrollTop - body.clientHeight;

    if (distanceFromBottom > 200) {
      scrollBtn.classList.add('show');
    } else {
      scrollBtn.classList.remove('show');
    }
  });
  scrollBtn?.addEventListener('click', () => {
    body.scrollTo({
      top: body.scrollHeight,
      behavior: 'smooth',
    });
  });
  container.addEventListener('click', async e => {
    const pinBtn = e.target.closest('.popup-header-action.pin');
    const deleteBtn = e.target.closest('.popup-header-action.delete');
    if (!pinBtn && !deleteBtn) return;
    headerMenu.classList.remove('show');
    // DELETE
    if (deleteBtn) {
      const confirmDelete = confirm('Delete this conversation?');
      if (!confirmDelete) return;
      try {
        await fetch(`/conversations/${conversationId}`, {
          method: 'DELETE',
        });
        container.innerHTML = '';
        socket.emit('leave_conversation', conversationId);
        window.openConversationId = null;
      } catch (err) {
        console.error(err);
      }
    }
  });
  container.addEventListener('click', e => {
    const replyBtn = e.target.closest('.popup-action.reply');
    if (!replyBtn) return;
    const menu = replyBtn.closest('.popup-msg-menu');
    menu.classList.remove('show');
    const messageId = menu.dataset.menuId;
    const bubble = container.querySelector(
      `.popup-bubble[data-message-id="${messageId}"]`,
    );
    if (!bubble) return;
    // console.log(bubble.innerHTML);
    let previewText = '';
    const textEl = bubble.querySelector('.message-text');
    if (textEl) {
      previewText = textEl.textContent.trim();
    }
    const imageEl = bubble.querySelector('.chat-image');
    if (imageEl) {
      previewText = '📷 Image';
    }
    const fileLink = bubble.querySelector('a');
    if (fileLink) {
      previewText = fileLink.textContent.trim();
    }
    replyMessage = {
      id: messageId,
      text: previewText,
    };
    replyPreview.style.display = 'block';
    replyPreview.innerHTML = `
  <div class="reply-box">
    <div class="reply-text">
      ${escapeHtml(replyMessage.text)}
    </div>
    <button
      type="button"
      id="cancelReply"
    >
      ✕
    </button>
  </div>
`;
  });
  container.addEventListener('click', e => {
    const cancelBtn = e.target.closest('#cancelReply');
    if (!cancelBtn) return;
    replyMessage = null;
    replyPreview.style.display = 'none';
    replyPreview.innerHTML = '';
  });

  container.addEventListener('click', e => {
    const btn = e.target.closest('.popup-msg-menu-btn');
    if (!btn) return;
    e.stopPropagation();
    const menu = btn.nextElementSibling;
    if (!menu) return;
    // Đóng các menu khác
    document.querySelectorAll('.popup-msg-menu.show').forEach(m => {
      if (m !== menu) {
        m.classList.remove('show');
        m.style.left = '';
        m.style.top = '';
      }
    });
    // Nếu menu đang mở -> đóng
    if (menu.classList.contains('show')) {
      menu.classList.remove('show');
      menu.style.left = '';
      menu.style.top = '';
      return;
    }
    // Mở menu trước
    menu.classList.add('show');
    // Đợi browser render menu xong rồi mới tính kích thước
    requestAnimationFrame(() => {
      const btnRect = btn.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const gap = 6;
      const margin = 8;
      let top;
      let left;
      // TÍNH VỊ TRÍ DỌC
      const spaceBelow = viewportHeight - btnRect.bottom - margin;
      const spaceAbove = btnRect.top - margin;
      // Có đủ chỗ phía dưới
      if (spaceBelow >= menuRect.height + gap) {
        top = btnRect.bottom + gap;
      }
      // Không đủ phía dưới nhưng đủ phía trên
      else if (spaceAbove >= menuRect.height + gap) {
        top = btnRect.top - menuRect.height - gap;
      }
      // Không đủ cả hai phía
      else {
        if (spaceBelow >= spaceAbove) {
          top = viewportHeight - menuRect.height - margin;
        } else {
          top = margin;
        }
      }
      // TÍNH VỊ TRÍ NGANG
      const isMine = btn.closest('.popup-msg.mine');
      if (isMine) {
        // Tin nhắn của mình -> ưu tiên mở bên trái nút ...
        left = btnRect.left - menuRect.width - gap;
        // Nếu tràn trái -> mở sang phải
        if (left < margin) {
          left = btnRect.right + gap;
        }
      } else {
        // Tin nhắn người khác -> ưu tiên mở bên phải
        left = btnRect.right + gap;
        // Nếu tràn phải -> mở sang trái
        if (left + menuRect.width > viewportWidth - margin) {
          left = btnRect.left - menuRect.width - gap;
        }
      }
      // KHÔNG CHO MENU RA NGOÀI MÀN HÌNH
      left = Math.max(
        margin,
        Math.min(left, viewportWidth - menuRect.width - margin),
      );
      top = Math.max(
        margin,
        Math.min(top, viewportHeight - menuRect.height - margin),
      );
      // GÁN VỊ TRÍ
      menu.style.left = `${left}px`;
      menu.style.top = `${top}px`;
    });
  });
  container.addEventListener('click', e => {
    const preview = e.target.closest('.reply-message-preview');
    if (!preview) return;
    const targetId = preview.dataset.replyId;
    const target = container.querySelector(
      `.popup-bubble[data-message-id="${targetId}"]`,
    );
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
  document.addEventListener('click', e => {
    if (e.target.closest('.popup-msg-actions')) return;
    document
      .querySelectorAll('.popup-msg-menu.show')
      .forEach(menu => menu.classList.remove('show'));
  });
  container.addEventListener('click', async e => {
    const recallBtn = e.target.closest('.popup-action.recall');
    if (!recallBtn) return;
    const menu = recallBtn.closest('.popup-msg-menu');
    menu.classList.remove('show');
    const messageId = menu.dataset.menuId;
    try {
      await fetch(`/messages/recall/${messageId}`, {
        method: 'POST',
      });
    } catch (err) {
      console.error(err);
    }
  });
  if (popupRecallHandler) {
    socket.off('message_recalled', popupRecallHandler);
  }
  popupRecallHandler = data => {
    const bubble = container.querySelector(
      `.popup-bubble[data-message-id="${data.messageId}"]`,
    );
    if (!bubble) return;
    bubble.innerHTML = `
    <i class="recalled-message">
      Message has been recalled
    </i>
  `;
    bubble.classList.add('recalled');
    bubble.classList.remove('media');
    const msg = bubble.closest('.popup-msg');
    const menuBtn = msg?.querySelector('.popup-msg-menu-btn');
    if (menuBtn) {
      menuBtn.remove();
    }
    const menu = msg?.querySelector('.popup-msg-menu');
    if (menu) {
      menu.remove();
    }
  };
  socket.on('message_recalled', popupRecallHandler);
  function renderPreview() {
    previewBox.innerHTML = selectedFiles
      .map(
        (file, index) => `
        <div class="preview-item ${
          file.type.startsWith('image/') ? 'image' : 'file'
        }">
          ${
            file.type.startsWith('image/')
              ? `
                <img
                  src="${URL.createObjectURL(file)}"
                  class="preview-img"
                />
              `
              : `
                <div class="preview-file">
                  📄 ${file.name}
                </div>
              `
          }
          <button
            type="button"
            class="preview-remove"
            data-index="${index}"
          >
            ×
          </button>
        </div>
      `,
      )
      .join('');
  }
  previewBox.addEventListener('click', e => {
    const btn = e.target.closest('.preview-remove');
    if (!btn) return;
    const index = Number(btn.dataset.index);
    selectedFiles.splice(index, 1);
    if (selectedFiles.length === 0) {
      fileInput.value = '';
    }
    requestAnimationFrame(updateScrollButtonPosition);
    renderPreview();
  });
  fileInput.addEventListener('change', e => {
    errorBox.style.display = 'none';
    errorBox.textContent = '';
    const MAX_SIZE = 10 * 1024 * 1024;
    const newFiles = Array.from(e.target.files);
    for (const file of newFiles) {
      // chỉ cho ảnh và PDF
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        errorBox.textContent = `${file.name}: Only images or PDF files are allowed`;
        errorBox.style.display = 'block';
        continue;
      }
      // quá 10MB
      if (file.size > MAX_SIZE) {
        errorBox.textContent = `${file.name}: File size exceeds 10MB`;
        errorBox.style.display = 'block';
        continue;
      }
      const exists = selectedFiles.some(
        f =>
          f.name === file.name &&
          f.size === file.size &&
          f.lastModified === file.lastModified,
      );
      if (!exists) {
        selectedFiles.push(file);
      }
    }
    renderPreview();
    fileInput.value = '';
  });
  attachBtn?.addEventListener('click', () => {
    fileInput.click();
  });
  let emojiPicker = null;
  emojiBtn?.addEventListener('click', () => {
    if (emojiPicker) {
      emojiPicker.remove();
      emojiPicker = null;
      return;
    }
    emojiPicker = document.createElement('emoji-picker');
    emojiContainer.innerHTML = '';
    emojiContainer.appendChild(emojiPicker);
    emojiPicker.addEventListener('emoji-click', event => {
      input.value += event.detail.unicode;
      input.dispatchEvent(new Event('input'));

      input.focus();
    });
  });
  searchBtn?.addEventListener('click', () => {
    if (searchBar.style.display === 'none') {
      searchBar.style.display = 'flex';
      searchInput.focus();
    } else {
      searchBar.style.display = 'none';
      container
        .querySelectorAll('.search-highlight')
        .forEach(el => el.classList.remove('search-highlight'));
    }
  });
  document.addEventListener('click', e => {
    if (
      !emojiPicker ||
      emojiContainer.contains(e.target) ||
      emojiBtn.contains(e.target)
    ) {
      return;
    }
    emojiPicker.remove();
    emojiPicker = null;
  });
  input?.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = input.scrollHeight + 'px';
  });
  input?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  searchInput?.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchMessages();
    }
  });
  body.scrollTop = body.scrollHeight;
  // SOCKET HANDLER (FIX DATE)
  if (popupMessageHandler) {
    socket.off('new_message', popupMessageHandler);
  }
  function renderPopupBubble(message, escapeHtml) {
    if (message.isRecalled) {
      return `
      <i class="recalled-message">
        Tin nhắn đã được thu hồi
      </i>
    `;
    }
    let html = '';
    // REPLY
    if (message.replySnapshot) {
      let previewText = message.replySnapshot.content;
      if (!previewText) {
        if (message.replySnapshot.messageType === 'image') {
          previewText = '📷 Image';
        } else if (message.replySnapshot.messageType === 'file') {
          previewText = `📎 ${message.replySnapshot.fileName || 'File'}`;
        }
      }
      html += `
      <div
        class="reply-message-preview"
        data-reply-id="${message.replyTo?._id || message.replyTo}"
      >
        ${escapeHtml(previewText)}
      </div>
    `;
    }
    // IMAGE
    if (message.type === 'image' && message.fileUrl) {
      html += `
      <img
        src="${message.fileUrl}"
        class="chat-image"
        alt="${escapeHtml(message.fileName || 'Image')}"
      />
    `;
    }
    // FILE
    if (message.type === 'file' && message.fileUrl) {
      html += `
      <a
        href="${message.fileUrl}"
        target="_blank"
        rel="noopener noreferrer"
        class="chat-file"
      >
        <i class="bi bi-file-earmark-pdf-fill"></i>
        <span>
          ${escapeHtml(message.fileName || 'File')}
        </span>
        <i class="bi bi-box-arrow-up-right"></i>
      </a>
    `;
    }
    // TEXT + EMOJI
    if (message.content) {
      html += `<div class="message-text">${escapeHtml(message.content)}</div>`;
    }
    return html;
  }
  popupMessageHandler = message => {
    // console.log('POPUP SOCKET:', message);
    // console.log('POPUP SOCKET FULL:', message);
    // console.log('POPUP SOCKET CONTENT:', JSON.stringify(message.content));
    // console.log('POPUP SOCKET TYPE:', message.type);
    // console.log('POPUP SOCKET FILE:', message.fileUrl);
    const msgConversationId =
      message.conversationId ||
      message.conversation?._id ||
      message.conversation;
    if (
      msgConversationId?.toString() !== window.openConversationId?.toString()
    ) {
      return;
    }
    const isMine = message.sender._id?.toString() === currentUserId?.toString();
    const actionsHtml = message.isRecalled
      ? ''
      : `
<div class="popup-msg-actions">

  <button
    class="popup-msg-menu-btn"
    data-message-id="${message._id}"
  >
    <i class="bi bi-three-dots"></i>
  </button>

  <div
    class="popup-msg-menu"
    data-menu-id="${message._id}"
  >
    <button class="popup-action reply">
      Reply
    </button>
      ${
        isMine
          ? `
          <button class="popup-action recall">
            Recall
          </button>
          `
          : ''
      }
  </div>
</div>
`;
    const msgDate = new Date(message.createdAt).toDateString();
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    let showDate = false;
    let dateLabel = '';
    // FIX CHÍNH: luôn update state
    if (msgDate !== lastPopupDate) {
      showDate = true;
      if (msgDate === today) dateLabel = 'Today';
      else if (msgDate === yesterday) dateLabel = 'Yesterday';
      else {
        dateLabel = new Date(message.createdAt).toLocaleDateString('ja-JP');
      }
    }
    // IMPORTANT: update state ngay cả khi không show
    lastPopupDate = msgDate;
    // render date nếu cần
    if (showDate) {
      body.insertAdjacentHTML(
        'beforeend',
        `<div class="popup-date-label">${dateLabel}</div>`,
      );
    }
    // render message
    const html = isMine
      ? `
        <div class="popup-msg mine">
          <div class="popup-content">
           ${actionsHtml}
            <div
  class="popup-bubble"
  data-message-id="${message._id}"
>
  ${renderPopupBubble(message, escapeHtml)}
</div>
            <div class="popup-time">
  ${
    message.time ||
    new Date(message.createdAt).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }
</div>
          </div>
        </div>
      `
      : `
        <div class="popup-msg">
          <img class="msg-avatar" src="${message.sender.avatar}" />
          <div class="popup-content">
           ${actionsHtml}
            <div
  class="popup-bubble"
  data-message-id="${message._id}"
>
  ${renderPopupBubble(message, escapeHtml)}
</div>
           <div class="popup-time">
  ${
    message.time ||
    new Date(message.createdAt).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }
</div>
          </div>
        </div>
      `;

    body.insertAdjacentHTML('beforeend', html);
    // FORCE RENDER TEXT + EMOJI
    const newBubble = body.querySelector(
      `.popup-bubble[data-message-id="${message._id}"]`,
    );
    if (newBubble && message.content) {
      let textElement = newBubble.querySelector('.message-text');
      if (!textElement) {
        textElement = document.createElement('div');
        textElement.className = 'message-text';
        newBubble.appendChild(textElement);
      }
      textElement.textContent = message.content;
    }
    body.scrollTop = body.scrollHeight;
  };
  socket.on('new_message', popupMessageHandler);
  async function searchMessages() {
    popupSearchKeyword = searchInput.value.trim();
    if (!popupSearchKeyword) {
      popupSearchResults = [];
      popupSearchIndex = -1;
      searchCount.textContent = popupSearchResults.length
        ? `${popupSearchIndex + 1} / ${popupSearchResults.length}`
        : '0 / 0';
      return;
    }
    const res = await fetch(
      `/messages/${conversationId}/search-message?q=${encodeURIComponent(popupSearchKeyword)}`,
    );
    const data = await res.json();
    popupSearchResults = Array.isArray(data) ? data : [];
    popupSearchResults = popupSearchResults.filter(m => !m.isRecalled);
    popupSearchIndex = popupSearchResults.length ? 0 : -1;
    updateSearchResult();
  }
  function updateSearchResult() {
    if (!popupSearchResults.length || popupSearchIndex === -1) {
      searchCount.textContent = '0 / 0';
      return;
    }
    searchCount.textContent = `${popupSearchIndex + 1} / ${popupSearchResults.length}`;
    const id = popupSearchResults[popupSearchIndex]?._id;
    if (!id) return;
    const target = container.querySelector(
      `.popup-bubble[data-message-id="${id}"]`,
    );
    if (!target) return;
    if (target.querySelector('.recalled-message')) return;
    target.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
    target.classList.add('search-highlight');
  }
  // SEND MESSAGE
  async function sendMessage() {
    if (isSending) return;
    const content = input.value.trim();
    if (!content && selectedFiles.length === 0) return;
    isSending = true;
    sendBtn.disabled = true;
    try {
      // FILE / IMAGE
      // + TEXT / EMOJI
      // gửi trong cùng request
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        formData.append('conversationId', conversationId);
        formData.append('content', content);
        if (replyMessage?.id) {
          formData.append('replyTo', replyMessage.id);
        }
        selectedFiles.forEach(file => {
          formData.append('files', file);
        });
        const uploadRes = await fetch('/messages/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData.success) {
          errorBox.textContent = uploadData.message || 'Upload failed';
          errorBox.style.display = 'block';
          return;
        }
      }
      // CHỈ TEXT / EMOJI
      else {
        const res = await fetch('/messages/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationId,
            content,
            replyTo: replyMessage?.id || null,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          errorBox.textContent = data.message || 'Failed to send message';
          errorBox.style.display = 'block';
          return;
        }
      }
      // RESET UI
      selectedFiles = [];
      fileInput.value = '';
      previewBox.innerHTML = '';
      replyMessage = null;
      replyPreview.style.display = 'none';
      replyPreview.innerHTML = '';
      errorBox.style.display = 'none';
      errorBox.textContent = '';
      input.value = '';
      input.focus();
      input.style.height = '38px';
      lastPopupDate = new Date().toDateString();
    } catch (err) {
      // console.error('SEND MESSAGE ERROR:', err);
      errorBox.textContent = 'Failed to send message';
      errorBox.style.display = 'block';
    } finally {
      sendBtn.disabled = false;
      isSending = false;
    }
  }
  footerForm?.addEventListener('submit', e => {
    e.preventDefault();
    sendMessage();
  });
  // CLOSE
  container.querySelector('.close-popup')?.addEventListener('click', () => {
    if (popupMessageHandler) {
      socket.off('new_message', popupMessageHandler);
      popupMessageHandler = null;
    }
    if (popupRecallHandler) {
      socket.off('message_recalled', popupRecallHandler);
      popupRecallHandler = null;
    }
    socket.emit('leave_conversation', window.openConversationId);
    window.openConversationId = null;
    footerObserver.disconnect();
    container.innerHTML = '';
  });

  async function markAsRead(conversationId) {
    try {
      const res = await fetch(`/messages/read/${conversationId}`, {
        method: 'POST',
      });
      if (!res.ok) return;
      if (res.ok) {
        // FORCE giảm badge ngay lập tức (UI sync ngay)
        const badge = document.querySelector(
          '.message-dropdown .notification-badge',
        );
        if (badge) {
          let current = parseInt(badge.textContent.replace('+', '')) || 0;
          current = Math.max(0, current - 1);
          badge.textContent = current > 99 ? '99+' : current;
          if (current === 0) {
            badge.remove();
          }
        }
      }
      // update dropdown card ngay
      const card = document.querySelector(
        `.message-card[data-conversation-id="${conversationId}"]`,
      );
      if (card) {
        card.classList.remove('unread');
        const dot = card.querySelector('.message-unread-dot');
        if (dot) {
          dot.remove();
        }
      }
      // update popup list bên page message
      const item = document.querySelector(
        `.conversation-item[href="/messages/${conversationId}"]`,
      );
      if (item) {
        item.classList.remove('unread');
        const badge = item.querySelector('.conversation-badge');
        if (badge) {
          badge.remove();
        }
      }
    } catch (err) {
      console.error(err);
    }
  }
}
// OPEN POPUP
document.addEventListener('click', e => {
  const card = e.target.closest('.message-card');
  if (!card) return;
  e.preventDefault();
  openChatPopup(
    card.dataset.conversationId,
    card.dataset.userName,
    card.dataset.userAvatar,
    card.dataset.popupUserId,
  );
  // console.log(card.dataset);
});
