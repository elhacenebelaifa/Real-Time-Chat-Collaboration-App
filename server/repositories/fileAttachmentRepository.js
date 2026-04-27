const FileAttachment = require('../models/FileAttachment');

const fileAttachmentRepository = {
  async create(data) {
    const file = new FileAttachment(data);
    await file.save();
    return file;
  },

  findById(id) {
    return FileAttachment.findById(id);
  },
};

module.exports = fileAttachmentRepository;
