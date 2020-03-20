const eventBus = require('../eventBus');
const { events } = require('../../utils/constants');
const Room = require('../../models/Room');
const pushService = require('../../services/pushService');

function registerMessageEvents(io) {
  eventBus.on(events.MESSAGE_CREATED, async (data) => {
    const { message } = data;
    const roomId = message.roomId.toString();

    if (message.threadParent) {
      io.to(roomId).emit('chat:thread-message', message);
      return;
    }

    io.to(roomId).emit('chat:message', message);

    // Fan out a lightweight notification to every member's user socket so
    // clients that have not joined the room (e.g. sitting on /chat with no
    // active conversation) still learn about new messages — drives popup
    // auto-open and sidebar preview updates.
    try {
      const room = await Room.findById(roomId).select('members name type').lean();
      if (room && Array.isArray(room.members)) {
        room.members.forEach((memberId) => {
          io.to(`user:${memberId.toString()}`).emit('chat:notify', message);
        });
        if (message.type !== 'system') {
          pushService.fanout(message, room).catch((err) => {
            console.error('push fan-out failed:', err);
          });
        }
      }
    } catch (err) {
      console.error('chat:notify fan-out failed:', err);
    }
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
