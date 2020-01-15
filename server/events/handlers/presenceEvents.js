const eventBus = require('../eventBus');
const { events } = require('../../utils/constants');
const User = require('../../models/User');
const presenceService = require('../../services/presenceService');

function registerPresenceEvents(io) {
  eventBus.on(events.USER_ONLINE, (data) => {
    const { userId, username } = data;
    User.findByIdAndUpdate(userId, { status: 'online' }).catch(() => {});
    presenceService.addOnline(userId).catch(() => {});
    io.emit('presence:online', { userId, username });
  });

  eventBus.on(events.USER_OFFLINE, (data) => {
    const { userId, username } = data;
    User.findByIdAndUpdate(userId, { status: 'offline', lastSeen: new Date() }).catch(() => {});
    presenceService.removeOnline(userId).catch(() => {});
    io.emit('presence:offline', { userId, username, lastSeen: new Date() });
  });
}

module.exports = registerPresenceEvents;
