const messageService = require('../services/messageService');
const eventBus = require('../events/eventBus');
const { events } = require('../utils/constants');

module.exports = function chatHandler(io, socket) {
  socket.on('chat:send', async (data, ack) => {
    try {
      const { roomId, content, type, encrypted, iv, fileAttachment, threadParent } = data;

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
        threadParent: threadParent || null,
      });

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

  socket.on('message:react', async (data, ack) => {
    try {
      const { messageId, emoji } = data;
      if (!messageId || !emoji) return ack && ack({ error: 'messageId and emoji required' });
      await messageService.toggleReaction(messageId, socket.userId, emoji);
      if (ack) ack({ ok: true });
    } catch (err) {
      console.error('message:react error:', err);
      if (ack) ack({ error: err.message });
    }
  });

  socket.on('message:pin', async (data, ack) => {
    try {
      const { roomId, messageId } = data;
      if (!roomId) return ack && ack({ error: 'roomId required' });
      await messageService.setPinned(roomId, messageId || null, socket.userId);
      if (ack) ack({ ok: true });
    } catch (err) {
      console.error('message:pin error:', err);
      if (ack) ack({ error: err.message });
    }
  });

  socket.on('message:edit', async (data, ack) => {
    try {
      const { messageId, content } = data;
      if (!messageId || typeof content !== 'string') {
        return ack && ack({ error: 'messageId and content required' });
      }
      await messageService.editMessage(messageId, socket.userId, content);
      if (ack) ack({ ok: true });
    } catch (err) {
      console.error('message:edit error:', err);
      if (ack) ack({ error: err.message });
    }
  });

  socket.on('message:delete', async (data, ack) => {
    try {
      const { messageId } = data;
      if (!messageId) return ack && ack({ error: 'messageId required' });
      await messageService.deleteMessage(messageId, socket.userId);
      if (ack) ack({ ok: true });
    } catch (err) {
      console.error('message:delete error:', err);
      if (ack) ack({ error: err.message });
    }
  });
};
