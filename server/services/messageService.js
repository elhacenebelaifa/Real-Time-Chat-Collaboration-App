const Message = require('../models/Message');
const roomService = require('./roomService');

const messageService = {
  async create({ roomId, senderId, content, type = 'text', encrypted = false, iv = '', fileAttachment = null }) {
    const message = new Message({
      roomId,
      sender: senderId,
      type,
      content,
      encrypted,
      iv,
      fileAttachment,
      readBy: [senderId],
    });

    await message.save();
    await message.populate('sender', 'username displayName avatar').execPopulate();

    // Update room's last message
    const preview = encrypted ? '[Encrypted]' : (type === 'file' ? '[File]' : content);
    await roomService.updateLastMessage(roomId, preview, senderId);

    return message;
  },

  async getByRoom(roomId, { before, limit = 50 } = {}) {
    const query = { roomId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .populate('sender', 'username displayName avatar')
      .sort({ createdAt: -1 })
      .limit(limit);

    return messages.reverse();
  },

  async markAsRead(messageId, userId) {
    return Message.findByIdAndUpdate(
      messageId,
      { $addToSet: { readBy: userId } },
      { new: true }
    );
  },
};

module.exports = messageService;
