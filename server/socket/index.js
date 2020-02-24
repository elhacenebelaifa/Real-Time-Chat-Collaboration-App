const socketio = require('socket.io');
const jwt = require('jsonwebtoken');
const chatHandler = require('./chatHandler');
const presenceHandler = require('./presenceHandler');
const roomHandler = require('./roomHandler');
const registerMessageEvents = require('../events/handlers/messageEvents');
const registerPresenceEvents = require('../events/handlers/presenceEvents');
const registerNotificationEvents = require('../events/handlers/notificationEvents');
const { subscribe, bridgeToRedis } = require('../events/redisEventBus');
const { events } = require('../utils/constants');

function initSocket(server) {
  const io = socketio(server);

  // Register event bus handlers
  registerMessageEvents(io);
  registerPresenceEvents(io);
  registerNotificationEvents(io);

  // Bridge key events to Redis for horizontal scaling
  Object.values(events).forEach((eventName) => {
    bridgeToRedis(eventName);
  });

  // Subscribe to Redis for cross-instance events
  subscribe();

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.query.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.username = decoded.username;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`> Socket connected: ${socket.username} (${socket.userId})`);

    socket.join(`user:${socket.userId}`);

    chatHandler(io, socket);
    presenceHandler(io, socket);
    roomHandler(io, socket);

    socket.on('error', (err) => {
      console.error(`Socket error for ${socket.username}:`, err.message);
    });
  });

  return io;
}

module.exports = initSocket;
