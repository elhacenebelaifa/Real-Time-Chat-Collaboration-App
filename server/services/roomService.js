const roomRepository = require('../repositories/roomRepository');

const roomService = {
  createGroup(name, creatorId, memberIds = []) {
    const allMembers = [...new Set([creatorId.toString(), ...memberIds.map(String)])];
    return roomRepository.create({
      name,
      type: 'group',
      members: allMembers,
      admins: [creatorId],
    });
  },

  async findOrCreateDM(userId1, userId2) {
    const existing = await roomRepository.findDmBetween(userId1, userId2);
    if (existing) return existing;
    return roomRepository.createDm(userId1, userId2);
  },

  getUserRooms(userId) {
    return roomRepository.findByMember(userId);
  },

  getRoom(roomId) {
    return roomRepository.findById(roomId);
  },

  joinRoom(roomId, userId) {
    return roomRepository.addMember(roomId, userId);
  },

  leaveRoom(roomId, userId) {
    return roomRepository.removeMember(roomId, userId);
  },

  updateLastMessage(roomId, content, senderId) {
    return roomRepository.setLastMessage(roomId, content, senderId);
  },
};

module.exports = roomService;
