const userRepository = require('../repositories/userRepository');
const ApiError = require('../utils/ApiError');

const VALID_LEVELS = ['all', 'mentions', 'none'];

const userService = {
  searchUsers(query, requesterId) {
    if (!query || query.length < 2) return Promise.resolve([]);
    return userRepository.searchByText(query, requesterId);
  },

  getOnlineUsers() {
    return userRepository.findOnline();
  },

  async getProfile(id) {
    const user = await userRepository.findProfile(id);
    if (!user) throw ApiError.notFound('User not found');
    return user;
  },

  async setPublicKey(callerId, targetId, publicKey) {
    if (callerId.toString() !== targetId.toString()) {
      throw ApiError.forbidden("Cannot update another user's key");
    }
    if (!publicKey) throw ApiError.badRequest('publicKey is required');
    await userRepository.updatePublicKey(targetId, publicKey);
  },

  levelFor(user, roomId) {
    const overrides = user && user.notificationOverrides;
    if (!overrides) return 'all';
    const key = roomId.toString();
    if (overrides instanceof Map) return overrides.get(key) || 'all';
    return overrides[key] || 'all';
  },

  async setNotificationLevel(userId, roomId, level) {
    if (!VALID_LEVELS.includes(level)) {
      throw ApiError.badRequest('level must be one of all|mentions|none');
    }
    if (level === 'all') {
      await userRepository.unsetNotificationOverride(userId, roomId);
    } else {
      await userRepository.setNotificationOverride(userId, roomId, level);
    }
    return level;
  },

  async subscribePush(userId, subscription, userAgent) {
    if (
      !subscription ||
      !subscription.endpoint ||
      !subscription.keys ||
      !subscription.keys.p256dh ||
      !subscription.keys.auth
    ) {
      throw ApiError.badRequest('Invalid subscription');
    }
    await userRepository.upsertPushSubscription(userId, subscription, userAgent);
  },

  async unsubscribePush(userId, endpoint) {
    if (!endpoint) throw ApiError.badRequest('endpoint is required');
    await userRepository.removePushSubscription(userId, endpoint);
  },

  setStatus(userId, status, lastSeen) {
    return userRepository.updateStatus(userId, status, lastSeen);
  },
};

module.exports = userService;
