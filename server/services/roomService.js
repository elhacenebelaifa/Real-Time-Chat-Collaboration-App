const Room = require('../models/Room');

const roomService = {
  async createGroup(name, creatorId, memberIds = []) {
    const allMembers = [...new Set([creatorId.toString(), ...memberIds.map(String)])];
    const room = new Room({
      name,
      type: 'group',
      members: allMembers,
      admins: [creatorId],
    });
    await room.save();
    return room.populate('members', 'username displayName avatar status')
      .populate({ path: 'pinnedMessage', populate: { path: 'sender', select: 'username displayName avatar' } }).execPopulate();
  },

  async findOrCreateDM(userId1, userId2) {
    const members = [userId1, userId2].sort();
    let room = await Room.findOne({
      type: 'dm',
      members: { $all: members, $size: 2 },
    }).populate('members', 'username displayName avatar status')
      .populate({ path: 'pinnedMessage', populate: { path: 'sender', select: 'username displayName avatar' } });

    if (!room) {
      room = new Room({ type: 'dm', members });
      await room.save();
      room = await room.populate('members', 'username displayName avatar status')
      .populate({ path: 'pinnedMessage', populate: { path: 'sender', select: 'username displayName avatar' } }).execPopulate();
    }

    return room;
  },

  async getUserRooms(userId) {
    return Room.find({ members: userId })
      .populate('members', 'username displayName avatar status')
      .populate({ path: 'pinnedMessage', populate: { path: 'sender', select: 'username displayName avatar' } })
      .sort({ 'lastMessage.timestamp': -1, updatedAt: -1 });
  },

  async getRoom(roomId) {
    return Room.findById(roomId)
      .populate('members', 'username displayName avatar status')
      .populate({ path: 'pinnedMessage', populate: { path: 'sender', select: 'username displayName avatar' } });
  },

  async joinRoom(roomId, userId) {
    return Room.findByIdAndUpdate(
      roomId,
      { $addToSet: { members: userId } },
      { new: true }
    ).populate('members', 'username displayName avatar status')
      .populate({ path: 'pinnedMessage', populate: { path: 'sender', select: 'username displayName avatar' } });
  },

  async leaveRoom(roomId, userId) {
    return Room.findByIdAndUpdate(
      roomId,
      { $pull: { members: userId } },
      { new: true }
    );
  },

  async updateLastMessage(roomId, content, senderId) {
    return Room.findByIdAndUpdate(roomId, {
      lastMessage: {
        content,
        sender: senderId,
        timestamp: new Date(),
      },
    });
  },
};

module.exports = roomService;
