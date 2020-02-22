const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        roomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room",
            required: true,
            index: true
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        type: {
            type: String,
            enum: ["text", "file", "system"],
            default: "text"
        },
        content: {
            type: String,
            default: ""
        },
        encrypted: {
            type: Boolean,
            default: false
        },
        iv: {
            type: String,
            default: ""
        },
        fileAttachment: {
            fileId: { type: mongoose.Schema.Types.ObjectId },
            fileName: String,
            fileSize: Number,
            mimeType: String,
            url: String
        },
        readBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],
        status: {
            type: String,
            enum: ["sent", "delivered", "read"],
            default: "sent"
        },
        reactions: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        threadParent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null,
            index: true
        },
        threadCount: {
            type: Number,
            default: 0
        },
        threadLatest: {
            type: Date,
            default: null
        },
        edited: {
            type: Boolean,
            default: false
        },
        editedAt: Date,
        deleted: {
            type: Boolean,
            default: false
        },
        mentions: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ]
    },
    {
        timestamps: true,
        minimize: false
    }
);

messageSchema.index({ roomId: 1, createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);
