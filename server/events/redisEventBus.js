const { v4: uuidv4 } = require('uuid');
const { pubClient, subClient } = require('../config/redis');
const eventBus = require('./eventBus');

const SERVER_ID = uuidv4();
const CHANNEL = 'chat:events';

// Publish an event to Redis so other instances receive it
function publish(eventName, data) {
  const message = JSON.stringify({ eventName, data, serverId: SERVER_ID });
  pubClient.publish(CHANNEL, message);
}

// Subscribe to Redis channel for cross-instance events
function subscribe() {
  subClient.subscribe(CHANNEL);

  subClient.on('message', (channel, message) => {
    if (channel !== CHANNEL) return;

    try {
      const parsed = JSON.parse(message);
      // Skip events from this server instance
      if (parsed.serverId === SERVER_ID) return;

      // Emit locally with a flag to prevent re-publishing
      eventBus.emit(parsed.eventName, { ...parsed.data, _fromRedis: true });
    } catch (err) {
      console.error('Redis message parse error:', err);
    }
  });
}

// Hook into the local event bus: when a local event fires,
// publish to Redis (unless it already came from Redis)
function bridgeToRedis(eventName) {
  eventBus.on(eventName, (data) => {
    if (data && data._fromRedis) return;
    publish(eventName, data);
  });
}

module.exports = { publish, subscribe, bridgeToRedis, SERVER_ID };
