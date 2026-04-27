const Message = require('../models/Message');

const SENDER_POPULATE = ['sender', 'username displayName avatar'];

const messageRepository = {
  async create(data) {
    const message = new Message(data);
    await message.save();
    await message.populate(...SENDER_POPULATE).execPopulate();
    return message;
  },

  findById(id) {
    return Message.findById(id);
  },

  findByIdPopulated(id) {
    return Message.findById(id).populate(...SENDER_POPULATE);
  },

  findByRoom(roomId, { before, limit = 50 } = {}) {
    const query = { roomId, threadParent: null, deleted: { $ne: true } };
    if (before) query.createdAt = { $lt: new Date(before) };
    return Message.find(query)
      .populate(...SENDER_POPULATE)
      .sort({ createdAt: -1 })
      .limit(limit);
  },

  findThread(parentId, { before, limit = 50 } = {}) {
    const query = { threadParent: parentId, deleted: { $ne: true } };
    if (before) query.createdAt = { $lt: new Date(before) };
    return Message.find(query)
      .populate(...SENDER_POPULATE)
      .sort({ createdAt: 1 })
      .limit(limit);
  },

  addReadReceipt(messageId, userId) {
    return Message.findByIdAndUpdate(
      messageId,
      { $addToSet: { readBy: userId } },
      { new: true }
    );
  },

  async saveReactions(message, reactions) {
    message.reactions = reactions;
    message.markModified('reactions');
    await message.save();
    return message;
  },

  async applyEdit(message, content, mentions) {
    message.content = content;
    message.mentions = mentions;
    message.edited = true;
    message.editedAt = new Date();
    await message.save();
    return message;
  },

  async softDelete(message) {
    message.deleted = true;
    message.content = '';
    message.fileAttachment = null;
    await message.save();
    return message;
  },

  incrementThreadCount(parentId, latestTimestamp) {
    return Message.findByIdAndUpdate(
      parentId,
      { $inc: { threadCount: 1 }, $set: { threadLatest: latestTimestamp } },
      { new: true }
    );
  },
};

module.exports = messageRepository;
