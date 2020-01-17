const messageService = require('../services/messageService');
const eventBus = require('../events/eventBus');
const { events } = require('../utils/constants');

module.exports = function chatHandler(io, socket) {
  socket.on('chat:send', async (data, ack) => {
    try {
      const { roomId, content, type, encrypted, iv, fileAttachment } = data;

      if (!roomId || (!content && type !== 'file')) {
        if (ack) ack({ error: 'roomId and content are required' });
        return;
      }

      const message = await messageService.create({
        roomId,
        senderId: socket.userId,
        content: content || '',
        type: type || 'text',
        encrypted: encrypted || false,
        iv: iv || '',
        fileAttachment: fileAttachment || null,
      });

      // Emit through event bus instead of directly broadcasting
      eventBus.emit(events.MESSAGE_CREATED, { message });

      if (ack) ack({ messageId: message._id });
    } catch (err) {
      console.error('chat:send error:', err);
      if (ack) ack({ error: 'Failed to send message' });
    }
  });

  socket.on('chat:read', async (data) => {
    try {
      const { roomId, messageId } = data;
      await messageService.markAsRead(messageId, socket.userId);
      eventBus.emit(events.MESSAGE_DELIVERED, {
        messageId,
        roomId,
        userId: socket.userId,
      });
    } catch (err) {
      console.error('chat:read error:', err);
    }
  });
};
