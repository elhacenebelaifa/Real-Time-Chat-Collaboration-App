const FileAttachment = require('../models/FileAttachment');

const fileService = {
  async saveMetadata({ originalName, storedName, mimeType, size, path, uploadedBy, roomId }) {
    const file = new FileAttachment({
      originalName,
      storedName,
      mimeType,
      size,
      path,
      uploadedBy,
      roomId,
    });
    await file.save();
    return file;
  },

  async getById(fileId) {
    return FileAttachment.findById(fileId);
  },
};

module.exports = fileService;
