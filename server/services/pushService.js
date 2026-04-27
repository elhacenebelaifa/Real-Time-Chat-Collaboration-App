const webpush = require('web-push');
const userRepository = require('../repositories/userRepository');

let configured = false;

function configure() {
  if (configured) return true;
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return false;
  webpush.setVapidDetails(
    VAPID_SUBJECT || 'mailto:admin@example.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
  configured = true;
  return true;
}

function buildPreview(message) {
  if (message.encrypted) return '[Encrypted]';
  if (message.type === 'file') return '[File]';
  const content = (message.content || '').trim();
  return content.length > 140 ? `${content.slice(0, 140)}…` : content;
}

function buildTitle(message, room) {
  const sender = message.sender || {};
  const senderName = sender.displayName || sender.username || 'New message';
  if (room.type === 'dm') return senderName;
  return `${senderName} in ${room.name || 'group'}`;
}

async function sendOne(user, subscription, payload) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (err) {
    if (err && (err.statusCode === 404 || err.statusCode === 410)) {
      await userRepository.removePushSubscription(user._id, subscription.endpoint);
    } else {
      console.error('web-push send failed:', err && err.statusCode, err && err.body);
    }
  }
}

async function fanout(message, room) {
  if (!configure()) return;
  if (!room || !Array.isArray(room.members)) return;

  const senderId = (message.sender && message.sender._id ? message.sender._id : message.sender).toString();
  const memberIds = room.members
    .map((m) => (m && m._id ? m._id : m).toString())
    .filter((id) => id !== senderId);

  if (!memberIds.length) return;

  const mentionSet = new Set((message.mentions || []).map((m) => m.toString()));
  const roomId = room._id ? room._id.toString() : room.toString();
  const preview = buildPreview(message);
  const title = buildTitle(message, room);
  const url = `/chat/${roomId}`;

  const users = await userRepository.findWithPushSubscriptionsByIds(memberIds);

  await Promise.all(users.map(async (user) => {
    if (!user.pushSubscriptions || !user.pushSubscriptions.length) return;
    const overrides = user.notificationOverrides || {};
    const level = (overrides instanceof Map ? overrides.get(roomId) : overrides[roomId]) || 'all';
    if (level === 'none') return;
    if (level === 'mentions' && !mentionSet.has(user._id.toString())) return;

    const payload = {
      title,
      body: preview,
      roomId,
      url,
      messageId: message._id ? message._id.toString() : undefined,
    };

    await Promise.all(user.pushSubscriptions.map((sub) => sendOne(
      user,
      { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } },
      payload
    )));
  }));
}

function getVapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY || '';
}

module.exports = { fanout, getVapidPublicKey };
