const { redisClient } = require('../config/redis');

const ONLINE_SET = 'online_users';

const presenceService = {
  addOnline(userId) {
    return new Promise((resolve, reject) => {
      redisClient.sadd(ONLINE_SET, userId.toString(), (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  },

  removeOnline(userId) {
    return new Promise((resolve, reject) => {
      redisClient.srem(ONLINE_SET, userId.toString(), (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  },

  getOnlineUsers() {
    return new Promise((resolve, reject) => {
      redisClient.smembers(ONLINE_SET, (err, members) => {
        if (err) reject(err);
        else resolve(members || []);
      });
    });
  },

  isOnline(userId) {
    return new Promise((resolve, reject) => {
      redisClient.sismember(ONLINE_SET, userId.toString(), (err, result) => {
        if (err) reject(err);
        else resolve(!!result);
      });
    });
  },
};

module.exports = presenceService;
