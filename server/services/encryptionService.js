const Room = require('../models/Room');

const encryptionService = {
  // Store an encrypted room key for a member
  async addEncryptedKey(roomId, userId, encryptedKey, iv) {
    return Room.findByIdAndUpdate(
      roomId,
      {
        $push: {
          encryptedKeys: { userId, encryptedKey, iv },
        },
      },
      { new: true }
    );
  },

  // Get the encrypted room key for a specific member
  async getEncryptedKey(roomId, userId) {
    const room = await Room.findById(roomId);
    if (!room) return null;
    return room.encryptedKeys.find(
      (k) => k.userId.toString() === userId.toString()
    );
  },
};

module.exports = encryptionService;
