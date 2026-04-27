const User = require('../models/User');

const SAFE_FIELDS = '-passwordHash';

const userRepository = {
  findById(id) {
    return User.findById(id);
  },

  findByIdSafe(id) {
    return User.findById(id).select(SAFE_FIELDS);
  },

  findByEmail(email) {
    return User.findOne({ email });
  },

  findByEmailOrUsername(email, username) {
    return User.findOne({ $or: [{ email }, { username }] });
  },

  findByUsernames(usernames) {
    return User.find({ username: { $in: usernames } }).select('_id');
  },

  searchByText(query, requesterId, limit = 20) {
    const regex = new RegExp(query, 'i');
    return User.find({
      _id: { $ne: requesterId },
      $or: [{ username: regex }, { displayName: regex }],
    })
      .select('username displayName avatar status publicKey')
      .limit(limit);
  },

  findOnline() {
    return User.find({ status: 'online' }).select('username displayName avatar');
  },

  findProfile(id) {
    return User.findById(id).select('username displayName avatar status publicKey lastSeen');
  },

  findWithPushSubscriptionsByIds(ids) {
    return User.find({ _id: { $in: ids } })
      .select('pushSubscriptions notificationOverrides')
      .lean();
  },

  async create({ username, email, password, displayName, publicKey }) {
    const user = new User({
      username,
      email,
      passwordHash: password,
      displayName: displayName || username,
      publicKey: publicKey || '',
    });
    await user.save();
    return user;
  },

  updatePublicKey(id, publicKey) {
    return User.findByIdAndUpdate(id, { publicKey });
  },

  updateStatus(id, status, lastSeen) {
    const update = { status };
    if (lastSeen) update.lastSeen = lastSeen;
    return User.findByIdAndUpdate(id, update);
  },

  setNotificationOverride(userId, roomId, level) {
    const key = `notificationOverrides.${roomId}`;
    return User.updateOne({ _id: userId }, { $set: { [key]: level } });
  },

  unsetNotificationOverride(userId, roomId) {
    const key = `notificationOverrides.${roomId}`;
    return User.updateOne({ _id: userId }, { $unset: { [key]: '' } });
  },

  async upsertPushSubscription(userId, subscription, userAgent) {
    await User.updateOne(
      { _id: userId, 'pushSubscriptions.endpoint': subscription.endpoint },
      { $set: { 'pushSubscriptions.$.keys': subscription.keys } }
    );
    await User.updateOne(
      { _id: userId, 'pushSubscriptions.endpoint': { $ne: subscription.endpoint } },
      {
        $push: {
          pushSubscriptions: {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
            userAgent: userAgent || '',
            createdAt: new Date(),
          },
        },
      }
    );
  },

  removePushSubscription(userId, endpoint) {
    return User.updateOne(
      { _id: userId },
      { $pull: { pushSubscriptions: { endpoint } } }
    );
  },
};

module.exports = userRepository;
