const eventBus = require('../eventBus');
const { events } = require('../../utils/constants');
const userService = require('../../services/userService');
const presenceService = require('../../services/presenceService');

function registerPresenceEvents(io) {
  eventBus.on(events.USER_ONLINE, (data) => {
    const { userId, username } = data;
    userService.setStatus(userId, 'online').catch(() => {});
    presenceService.addOnline(userId).catch(() => {});
    io.emit('presence:online', { userId, username });
  });

  eventBus.on(events.USER_OFFLINE, (data) => {
    const { userId, username } = data;
    const lastSeen = new Date();
    userService.setStatus(userId, 'offline', lastSeen).catch(() => {});
    presenceService.removeOnline(userId).catch(() => {});
    io.emit('presence:offline', { userId, username, lastSeen });
  });
}

module.exports = registerPresenceEvents;
