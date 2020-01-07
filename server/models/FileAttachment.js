const mongoose = require('mongoose');

const fileAttachmentSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  storedName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  path: { type: String, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
}, {
  timestamps: true,
});

module.exports = mongoose.model('FileAttachment', fileAttachmentSchema);
