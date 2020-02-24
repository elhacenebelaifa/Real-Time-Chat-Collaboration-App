const Message = require('../models/Message');
const Room = require('../models/Room');
const User = require('../models/User');
const roomService = require('./roomService');
const eventBus = require('../events/eventBus');
const { events } = require('../utils/constants');

const MENTION_RE = /@([a-zA-Z0-9_]{2,30})/g;

async function resolveMentions(content) {
  if (!content) return [];
  const usernames = [...new Set([...content.matchAll(MENTION_RE)].map((m) => m[1].toLowerCase()))];
  if (!usernames.length) return [];
  const users = await User.find({ username: { $in: usernames } }).select('_id');
  return users.map((u) => u._id);
}

function emitMentions(mentions, { senderId, roomId, messageId }) {
  mentions.forEach((userId) => {
    if (userId.toString() === senderId.toString()) return;
    eventBus.emit(events.MENTION_CREATED, {
      userId: userId.toString(),
      roomId: roomId.toString(),
      messageId: messageId.toString(),
      from: senderId.toString(),
    });
  });
}

const messageService = {
  async create({ roomId, senderId, content, type = 'text', encrypted = false, iv = '', fileAttachment = null, threadParent = null }) {
    const mentions = encrypted ? [] : await resolveMentions(content);

    const message = new Message({
      roomId,
      sender: senderId,
      type,
      content,
      encrypted,
      iv,
      fileAttachment,
      readBy: [senderId],
      mentions,
      threadParent,
    });

    await message.save();
    await message.populate('sender', 'username displayName avatar').execPopulate();

    if (threadParent) {
      const parent = await Message.findByIdAndUpdate(
        threadParent,
        { $inc: { threadCount: 1 }, $set: { threadLatest: message.createdAt } },
        { new: true }
      );
      if (parent) {
        eventBus.emit(events.THREAD_UPDATED, {
          roomId: parent.roomId,
          parentId: parent._id,
          threadCount: parent.threadCount,
          threadLatest: parent.threadLatest,
        });
      }
    } else {
      const preview = encrypted ? '[Encrypted]' : (type === 'file' ? '[File]' : content);
      await roomService.updateLastMessage(roomId, preview, senderId);
    }

    emitMentions(mentions, { senderId, roomId, messageId: message._id });

    return message;
  },

  async getByRoom(roomId, { before, limit = 50 } = {}) {
    const query = { roomId, threadParent: null, deleted: { $ne: true } };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .populate('sender', 'username displayName avatar')
      .sort({ createdAt: -1 })
      .limit(limit);

    return messages.reverse();
  },

  async getThread(parentId, { before, limit = 50 } = {}) {
    const query = { threadParent: parentId, deleted: { $ne: true } };
    if (before) query.createdAt = { $lt: new Date(before) };
    const messages = await Message.find(query)
      .populate('sender', 'username displayName avatar')
      .sort({ createdAt: 1 })
      .limit(limit);
    return messages;
  },

  async markAsRead(messageId, userId) {
    return Message.findByIdAndUpdate(
      messageId,
      { $addToSet: { readBy: userId } },
      { new: true }
    );
  },

  async toggleReaction(messageId, userId, emoji) {
    const message = await Message.findById(messageId);
    if (!message) throw new Error('Message not found');

    const uid = userId.toString();
    const prev = message.reactions || {};
    const hadSame = (prev[emoji] || []).some((u) => u.toString() === uid);
    const reactions = {};
    for (const [key, users] of Object.entries(prev)) {
      const filtered = (users || []).map((u) => u.toString()).filter((u) => u !== uid);
      if (filtered.length) reactions[key] = filtered;
    }
    if (!hadSame) {
      reactions[emoji] = [...(reactions[emoji] || []), uid];
    }

    message.reactions = reactions;
    message.markModified('reactions');
    await message.save();

    eventBus.emit(events.REACTION_UPDATED, {
      roomId: message.roomId,
      messageId: message._id,
      reactions: message.reactions,
    });

    return message;
  },

  async setPinned(roomId, messageId, userId) {
    const room = await Room.findById(roomId);
    if (!room) throw new Error('Room not found');
    if (!room.members.some((m) => m.toString() === userId.toString())) {
      throw new Error('Not a room member');
    }

    const current = room.pinnedMessage ? room.pinnedMessage.toString() : null;
    const next = messageId && current !== messageId.toString() ? messageId : null;

    room.pinnedMessage = next;
    await room.save();

    let populated = null;
    if (next) {
      populated = await Message.findById(next).populate('sender', 'username displayName avatar');
    }

    eventBus.emit(events.MESSAGE_PINNED, {
      roomId: room._id,
      pinnedMessage: populated,
    });

    return populated;
  },

  async editMessage(messageId, userId, content) {
    const message = await Message.findById(messageId);
    if (!message) throw new Error('Message not found');
    if (message.sender.toString() !== userId.toString()) throw new Error('Not allowed');
    if (message.type !== 'text') throw new Error('Only text messages can be edited');

    const mentions = message.encrypted ? [] : await resolveMentions(content);

    message.content = content;
    message.mentions = mentions;
    message.edited = true;
    message.editedAt = new Date();
    await message.save();

    eventBus.emit(events.MESSAGE_EDITED, {
      roomId: message.roomId,
      messageId: message._id,
      content: message.content,
      editedAt: message.editedAt,
      mentions: message.mentions,
    });

    emitMentions(mentions, { senderId: userId, roomId: message.roomId, messageId: message._id });

    return message;
  },

  async deleteMessage(messageId, userId) {
    const message = await Message.findById(messageId);
    if (!message) throw new Error('Message not found');
    if (message.sender.toString() !== userId.toString()) throw new Error('Not allowed');

    message.deleted = true;
    message.content = '';
    message.fileAttachment = null;
    await message.save();

    eventBus.emit(events.MESSAGE_DELETED, {
      roomId: message.roomId,
      messageId: message._id,
    });

    return message;
  },
};

module.exports = messageService;
