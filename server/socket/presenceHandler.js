const eventBus = require('../events/eventBus');
const { events } = require('../utils/constants');

module.exports = function presenceHandler(io, socket) {
  // Emit online through event bus
  eventBus.emit(events.USER_ONLINE, {
    userId: socket.userId,
    username: socket.username,
  });

  // Typing indicators (kept direct - no need for event bus, room-scoped)
  socket.on('typing:start', (data) => {
    const { roomId } = data;
    if (roomId) {
      socket.to(roomId).emit('typing:update', {
        roomId,
        userId: socket.userId,
        username: socket.username,
        isTyping: true,
      });
    }
  });

  socket.on('typing:stop', (data) => {
    const { roomId } = data;
    if (roomId) {
      socket.to(roomId).emit('typing:update', {
        roomId,
        userId: socket.userId,
        username: socket.username,
        isTyping: false,
      });
    }
  });

  socket.on('disconnect', () => {
    console.log(`> Socket disconnected: ${socket.username}`);
    eventBus.emit(events.USER_OFFLINE, {
      userId: socket.userId,
      username: socket.username,
    });
  });
};
