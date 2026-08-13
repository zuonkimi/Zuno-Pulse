module.exports = {
  // TASK STATUS CLASS
  taskStatusClass: task => {
    if (!task) return '';
    if (task.status === 'done') return 'table-success';
    if (task.status === 'cancelled') return 'table-secondary';
    if (task.isOverdue) return 'table-danger';
    if (task.isSoon) return 'table-warning';
    return '';
  },

  // FORMAT DATE (DISPLAY)
  formatDate: date => {
    if (!date) return '';

    return new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(date));
  },

  // FORMAT DATE (INPUT)
  formatDateInput: date => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  },

  formatTime(date) {
    if (!date) return '';

    const now = Date.now();
    const target = new Date(date).getTime();

    if (isNaN(target)) return '';

    const diff = Math.floor((now - target) / 1000);

    // < 1 phút
    if (diff < 60) {
      return 'Vừa xong';
    }

    // < 1 giờ
    if (diff < 3600) {
      const minutes = Math.floor(diff / 60);
      return `${minutes} phút`;
    }

    // < 24 giờ
    if (diff < 86400) {
      const hours = Math.floor(diff / 3600);
      return `${hours} giờ`;
    }

    // < 7 ngày
    if (diff < 604800) {
      const days = Math.floor(diff / 86400);
      return `${days} ngày`;
    }

    // quá 7 ngày
    return new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(date));
  },

  // EQUALITY CHECK
  eq: (a, b) => a === b,

  ifCond: function (v1, operator, v2, options) {
    switch (operator) {
      case '==':
        return v1 == v2 ? options.fn(this) : options.inverse(this);
      case '===':
        return v1 === v2 ? options.fn(this) : options.inverse(this);
      case '!=':
        return v1 != v2 ? options.fn(this) : options.inverse(this);
      case '!==':
        return v1 !== v2 ? options.fn(this) : options.inverse(this);
      case '<':
        return v1 < v2 ? options.fn(this) : options.inverse(this);
      case '<=':
        return v1 <= v2 ? options.fn(this) : options.inverse(this);
      case '>':
        return v1 > v2 ? options.fn(this) : options.inverse(this);
      case '>=':
        return v1 >= v2 ? options.fn(this) : options.inverse(this);
      case '&&':
        return v1 && v2 ? options.fn(this) : options.inverse(this);
      case '||':
        return v1 || v2 ? options.fn(this) : options.inverse(this);
      default:
        return options.inverse(this);
    }
  },

  // GREATER THAN
  gt: (a, b) => a > b,

  // SELECT OPTION
  selected: (value, current) => {
    return value === current ? 'selected' : '';
  },

  // CUSTOM TIME
  timeAgo: date => {
    if (!date) return '';
    const now = Date.now();
    const d = new Date(date).getTime();
    if (isNaN(d)) return '';
    const diff = Math.floor((now - d) / 1000);
    if (diff < 0) return '未来';
    if (diff < 60) return 'たった今';
    if (diff < 3600) {
      const m = Math.floor(diff / 60);
      return `${m}分前`;
    }
    if (diff < 86400) {
      const h = Math.floor(diff / 3600);
      return `${h}時間前`;
    }
    if (diff < 604800) {
      const day = Math.floor(diff / 86400);
      return `${day}日前`;
    }
    return new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(date));
  },

  // STRING INCLUDES (CASE INSENSITIVE)
  includes: (string, keyword) => {
    if (!string || !keyword) return false;
    return String(string).toLowerCase().includes(String(keyword).toLowerCase());
  },

  arrayIncludes: (value, keyword) => {
    if (!value || !keyword) return false;
    if (Array.isArray(value)) {
      return value.some(v => String(v) === String(keyword));
    }
    return String(value).toLowerCase().includes(String(keyword).toLowerCase());
  },

  toTimestamp(date) {
    return new Date(date).getTime();
  },

  // HIGHLIGHT SEARCH KEYWORD
  highlight: (text, keyword) => {
    if (!text || !keyword) return text;
    const regex = new RegExp(`(${keyword})`, 'gi');
    return String(text).replace(regex, '<mark>$1</mark>');
  },
};
