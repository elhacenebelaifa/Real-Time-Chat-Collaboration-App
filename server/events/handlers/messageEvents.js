const eventBus = require('../eventBus');
const { events } = require('../../utils/constants');

function registerMessageEvents(io) {
  eventBus.on(events.MESSAGE_CREATED, (data) => {
    const { message } = data;
    io.to(message.roomId.toString()).emit('chat:message', message);
  });

  eventBus.on(events.MESSAGE_DELIVERED, (data) => {
    const { messageId, roomId, userId } = data;
    io.to(roomId).emit('chat:delivered', { messageId, roomId, userId });
  });

  eventBus.on(events.REACTION_UPDATED, (data) => {
    const { roomId, messageId, reactions } = data;
    io.to(roomId.toString()).emit('chat:reaction', { messageId, reactions });
  });

  eventBus.on(events.MESSAGE_PINNED, (data) => {
    const { roomId, pinnedMessage } = data;
    io.to(roomId.toString()).emit('chat:pinned', { roomId, pinnedMessage });
  });

  eventBus.on(events.MESSAGE_EDITED, (data) => {
    const { roomId, messageId, content, editedAt, mentions } = data;
    io.to(roomId.toString()).emit('chat:edited', { messageId, content, editedAt, mentions });
  });

  eventBus.on(events.MESSAGE_DELETED, (data) => {
    const { roomId, messageId } = data;
    io.to(roomId.toString()).emit('chat:deleted', { messageId });
  });

  eventBus.on(events.THREAD_UPDATED, (data) => {
    const { roomId, parentId, threadCount, threadLatest } = data;
    io.to(roomId.toString()).emit('chat:thread-count', { parentId, threadCount, threadLatest });
  });

  eventBus.on(events.MENTION_CREATED, (data) => {
    const { userId, roomId, messageId, from } = data;
    io.to(`user:${userId}`).emit('chat:mention', { roomId, messageId, from });
  });
}

module.exports = registerMessageEvents;
