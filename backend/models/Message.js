import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    wa_id: {
        type: String,
        required: true,
        index: true,
    },
    user_name: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        default: "",
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true,
    },
    status: {
        type: String,
        enum: ["sent", "delivered", "read", "failed", "sending"],
        default: "sent",
        index: true,
    },
    meta_msg_id: {
        type: String,
        sparse: true,
        index: true,
    },
    from: {
        type: String,
        default: "",
    },
    direction: {
        type: String,
        enum: ["inbound", "outbound"],
        default: "outbound",
        index: true,
    },
    // Attachment fields
    attachmentUrl: {
        type: String,
        default: null,
    },
    originalFileName: {
        type: String,
        default: null,
    },
    fileType: {
        type: String,
        default: null,
    },
    fileSize: {
        type: Number,
        default: null,
    },
    attachments: [{
        url: String,
        filename: String,
        originalName: String,
        mimeType: String,
        size: Number,
        type: String
    }]
}, {
    timestamps: true,
    collection: "processed_messagess"
});

messageSchema.index({ wa_id: 1, timestamp: -1 });
messageSchema.index({ direction: 1, timestamp: -1 });
messageSchema.index({ status: 1, timestamp: -1 });

messageSchema.pre('save', function (next) {
    if (this.attachmentUrl && (!this.attachments || this.attachments.length === 0)) {
        this.attachments = [{
            url: this.attachmentUrl,
            filename: this.originalFileName || this.attachmentUrl.split('/').pop(),
            originalName: this.originalFileName,
            mimeType: this.fileType,
            size: this.fileSize,
            type: getFileTypeFromMimeType(this.fileType)
        }];
    }

    next();
});

function getFileTypeFromMimeType(mimeType) {
    if (!mimeType) return 'document';

    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType === 'text/vcard' || mimeType === 'text/x-vcard') return 'contact';

    return 'document';
}

const Message = mongoose.model("Message", messageSchema);

export default Message;
