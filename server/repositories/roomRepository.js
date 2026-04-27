const Room = require('../models/Room');

const MEMBER_FIELDS = 'username displayName avatar status';
const PINNED_POPULATE = {
  path: 'pinnedMessage',
  populate: { path: 'sender', select: 'username displayName avatar' },
};

function populateRoom(query) {
  return query.populate('members', MEMBER_FIELDS).populate(PINNED_POPULATE);
}

const roomRepository = {
  async create({ name, type, members, admins }) {
    const room = new Room({ name, type, members, admins });
    await room.save();
    return room.populate('members', MEMBER_FIELDS).populate(PINNED_POPULATE).execPopulate();
  },

  findById(id) {
    return populateRoom(Room.findById(id));
  },

  findByIdLean(id) {
    return Room.findById(id).select('members name type').lean();
  },

  findDmBetween(userIdA, userIdB) {
    const members = [userIdA, userIdB].sort();
    return populateRoom(
      Room.findOne({ type: 'dm', members: { $all: members, $size: 2 } })
    );
  },

  async createDm(userIdA, userIdB) {
    const members = [userIdA, userIdB].sort();
    const room = new Room({ type: 'dm', members });
    await room.save();
    return room.populate('members', MEMBER_FIELDS).populate(PINNED_POPULATE).execPopulate();
  },

  findByMember(userId) {
    return populateRoom(Room.find({ members: userId }))
      .sort({ 'lastMessage.timestamp': -1, updatedAt: -1 });
  },

  addMember(roomId, userId) {
    return populateRoom(
      Room.findByIdAndUpdate(roomId, { $addToSet: { members: userId } }, { new: true })
    );
  },

  removeMember(roomId, userId) {
    return Room.findByIdAndUpdate(
      roomId,
      { $pull: { members: userId } },
      { new: true }
    );
  },

  setLastMessage(roomId, content, senderId, timestamp = new Date()) {
    return Room.findByIdAndUpdate(roomId, {
      lastMessage: { content, sender: senderId, timestamp },
    });
  },

  async setPinnedMessage(roomId, userId, candidateMessageId) {
    const room = await Room.findById(roomId);
    if (!room) return { error: 'NOT_FOUND' };
    if (!room.members.some((m) => m.toString() === userId.toString())) {
      return { error: 'NOT_MEMBER' };
    }
    const current = room.pinnedMessage ? room.pinnedMessage.toString() : null;
    const next = candidateMessageId && current !== candidateMessageId.toString()
      ? candidateMessageId
      : null;
    room.pinnedMessage = next;
    await room.save();
    return { room, pinnedId: next };
  },

  setEncryptedKey(roomId, userId, encryptedKey, iv) {
    return Room.findByIdAndUpdate(
      roomId,
      { $push: { encryptedKeys: { userId, encryptedKey, iv } } },
      { new: true }
    );
  },

  async getEncryptedKey(roomId, userId) {
    const room = await Room.findById(roomId);
    if (!room) return null;
    return room.encryptedKeys.find(
      (k) => k.userId.toString() === userId.toString()
    );
  },
};

module.exports = roomRepository;
