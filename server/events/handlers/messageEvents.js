const eventBus = require('../eventBus');
const { events } = require('../../utils/constants');

function registerMessageEvents(io) {
  eventBus.on(events.MESSAGE_CREATED, (data) => {
    const { message } = data;
    // Broadcast to all clients in the room
    io.to(message.roomId.toString()).emit('chat:message', message);
  });

  eventBus.on(events.MESSAGE_DELIVERED, (data) => {
    const { messageId, roomId, userId } = data;
    io.to(roomId).emit('chat:delivered', { messageId, roomId, userId });
  });
}

module.exports = registerMessageEvents;
