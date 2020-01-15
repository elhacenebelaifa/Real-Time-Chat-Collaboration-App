const eventBus = require('../eventBus');
const { events } = require('../../utils/constants');

function registerNotificationEvents(io) {
  eventBus.on(events.ROOM_CREATED, (data) => {
    const { room } = data;
    // Notify all room members
    room.members.forEach((memberId) => {
      io.to(`user:${memberId}`).emit('room:updated', { room });
    });
  });

  eventBus.on(events.MEMBER_JOINED, (data) => {
    const { roomId, userId, username } = data;
    io.to(roomId).emit('room:updated', {
      roomId,
      event: 'member_joined',
      userId,
      username,
    });
  });
}

module.exports = registerNotificationEvents;
