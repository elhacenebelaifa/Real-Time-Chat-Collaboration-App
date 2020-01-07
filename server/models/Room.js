const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    maxlength: 100,
  },
  type: {
    type: String,
    enum: ['group', 'dm'],
    required: true,
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  encryptedKeys: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    encryptedKey: String,
    iv: String,
  }],
  lastMessage: {
    content: String,
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: Date,
  },
}, {
  timestamps: true,
});

roomSchema.index({ members: 1 });
roomSchema.index({ type: 1, members: 1 });

module.exports = mongoose.model('Room', roomSchema);
