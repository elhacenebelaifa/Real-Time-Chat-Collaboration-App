const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  kind: { type: String, enum: ['image', 'video', 'poster'], required: true },
  label: { type: String, required: true },
  path: { type: String, required: true },
  size: { type: Number, required: true },
  mimeType: { type: String, required: true },
  width: Number,
  height: Number,
}, { _id: false });

const fileAttachmentSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  storedName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  path: { type: String, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  variants: { type: [variantSchema], default: [] },
  compressionStatus: {
    type: String,
    enum: ['none', 'partial', 'success', 'failed'],
    default: 'none',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('FileAttachment', fileAttachmentSchema);
