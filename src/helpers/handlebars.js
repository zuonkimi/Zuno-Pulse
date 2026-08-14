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
  // FORMAT DATE (DISPLAY) - absolute date, used for deadline, created date...
  formatDate: date => {
    if (!date) return '';
    return new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(date));
  },
  // FORMAT DATE (INPUT) - used only for value of <input type="date">
  formatDateInput: date => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  },
  // TIME AGO - SINGLE mechanism for relative time (notification, message, comment...)
  timeAgo: date => {
    if (!date) return '';
    const now = Date.now();
    const target = new Date(date).getTime();
    if (isNaN(target)) return '';
    const diff = Math.floor((now - target) / 1000);
    if (diff < 0) return 'just now';
    if (diff < 60) return 'just now';

    if (diff < 3600) {
      const minutes = Math.floor(diff / 60);
      return `${minutes}m ago`;
    }
    if (diff < 86400) {
      const hours = Math.floor(diff / 3600);
      return `${hours}h ago`;
    }
    if (diff < 604800) {
      const days = Math.floor(diff / 86400);
      return `${days}d ago`;
    }
    // over 7 days -> show absolute date
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
