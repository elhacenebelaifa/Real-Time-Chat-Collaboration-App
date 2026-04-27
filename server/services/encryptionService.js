const roomRepository = require('../repositories/roomRepository');

const encryptionService = {
  addEncryptedKey(roomId, userId, encryptedKey, iv) {
    return roomRepository.setEncryptedKey(roomId, userId, encryptedKey, iv);
  },

  getEncryptedKey(roomId, userId) {
    return roomRepository.getEncryptedKey(roomId, userId);
  },
};

module.exports = encryptionService;
