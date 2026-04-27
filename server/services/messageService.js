const messageRepository = require('../repositories/messageRepository');
const userRepository = require('../repositories/userRepository');
const roomService = require('./roomService');
const eventBus = require('../events/eventBus');
const { events } = require('../utils/constants');
const ApiError = require('../utils/ApiError');

const MENTION_RE = /@([a-zA-Z0-9_]{2,30})/g;

async function resolveMentions(content) {
  if (!content) return [];
  const usernames = [...new Set([...content.matchAll(MENTION_RE)].map((m) => m[1].toLowerCase()))];
  if (!usernames.length) return [];
  const users = await userRepository.findByUsernames(usernames);
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

    const message = await messageRepository.create({
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

    if (threadParent) {
      const parent = await messageRepository.incrementThreadCount(threadParent, message.createdAt);
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

  getByRoom(roomId, options = {}) {
    return messageRepository.findByRoom(roomId, options).then((messages) => messages.reverse());
  },

  getThread(parentId, options = {}) {
    return messageRepository.findThread(parentId, options);
  },

  markAsRead(messageId, userId) {
    return messageRepository.addReadReceipt(messageId, userId);
  },

  async toggleReaction(messageId, userId, emoji) {
    const message = await messageRepository.findById(messageId);
    if (!message) throw ApiError.notFound('Message not found');

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

    await messageRepository.saveReactions(message, reactions);

    eventBus.emit(events.REACTION_UPDATED, {
      roomId: message.roomId,
      messageId: message._id,
      reactions: message.reactions,
    });

    return message;
  },

  async setPinned(roomId, messageId, userId) {
    const roomRepository = require('../repositories/roomRepository');
    const result = await roomRepository.setPinnedMessage(roomId, userId, messageId);
    if (result.error === 'NOT_FOUND') throw ApiError.notFound('Room not found');
    if (result.error === 'NOT_MEMBER') throw ApiError.forbidden('Not a room member');

    let populated = null;
    if (result.pinnedId) {
      populated = await messageRepository.findByIdPopulated(result.pinnedId);
    }

    eventBus.emit(events.MESSAGE_PINNED, {
      roomId: result.room._id,
      pinnedMessage: populated,
    });

    return populated;
  },

  async editMessage(messageId, userId, content) {
    const message = await messageRepository.findById(messageId);
    if (!message) throw ApiError.notFound('Message not found');
    if (message.sender.toString() !== userId.toString()) throw ApiError.forbidden('Not allowed');
    if (message.type !== 'text') throw ApiError.badRequest('Only text messages can be edited');

    const mentions = message.encrypted ? [] : await resolveMentions(content);
    await messageRepository.applyEdit(message, content, mentions);

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
    const message = await messageRepository.findById(messageId);
    if (!message) throw ApiError.notFound('Message not found');
    if (message.sender.toString() !== userId.toString()) throw ApiError.forbidden('Not allowed');

    await messageRepository.softDelete(message);

    eventBus.emit(events.MESSAGE_DELETED, {
      roomId: message.roomId,
      messageId: message._id,
    });

    return message;
  },
};

module.exports = messageService;
