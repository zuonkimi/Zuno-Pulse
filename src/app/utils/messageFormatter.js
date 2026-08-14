function formatMessages(messages) {
  let lastDate = null;
  return messages.map(m => {
    const d = new Date(m.createdAt);
    const dateStr = d.toDateString();
    let showDate = false;
    let dateLabel = '';
    if (dateStr !== lastDate) {
      showDate = true;
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (dateStr === today) dateLabel = 'Hôm nay';
      else if (dateStr === yesterday) dateLabel = 'Hôm qua';
      else {
        dateLabel = d.toLocaleDateString('ja-JP', {
          timeZone: 'Asia/Tokyo',
        });
      }
    }
    lastDate = dateStr;
    return {
      ...(m.toObject?.() || m),
      showDate,
      dateLabel,
      time: d.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Tokyo',
      }),
    };
  });
}

module.exports = { formatMessages };
