const redis = require('redis');
// Nếu có REDIS_URL (VD: Upstash, Render Redis...) thì dùng, không thì fallback về localhost cho môi trường dev
const client = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    connectTimeout: 3000, // tối đa 3 giây cho mỗi lần thử kết nối
    reconnectStrategy: retries => {
      if (retries > 2) return new Error('Redis unreachable, giving up'); // dừng retry vô hạn
      return Math.min(retries * 200, 1000);
    },
  },
});

client.on('error', err => console.error('Redis error:', err));
client.on('connect', () => console.log('Redis connecting...'));
client.on('ready', () => console.log('Redis ready'));
let isConnecting = false;
const connectRedis = async () => {
  try {
    if (client.isOpen) return;
    if (!isConnecting) {
      isConnecting = true;
      // Bọc thêm 1 lớp timeout ở ngoài để chắc chắn không bao giờ treo quá 4 giây,
      // dù reconnectStrategy có hoạt động đúng hay không
      await Promise.race([
        client.connect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Redis connect timeout')), 4000),
        ),
      ]);
      isConnecting = false;
    }
  } catch (err) {
    isConnecting = false;
    console.error('Redis connect failed:', err.message);
  }
};

const safeDel = async key => {
  try {
    if (client.isOpen) await client.del(key);
  } catch (err) {
    console.error('Redis DEL error:', err.message);
  }
};

module.exports = { client, connectRedis, safeDel };
