import Message from "../models/Message.js";
import sanitizeHtml from "sanitize-html";

export const getAllMessagesByWaId = async (req, res) => {
    try {
        const wa_id = req.params.wa_id;

        if (!wa_id) {
            return res.status(400).json({ error: "wa_id is required" });
        }

        const messages = await Message.find({ wa_id }).sort({ timestamp: 1 });

        const mappedMessages = messages.map((m) => ({
            _id: m._id,
            wa_id: m.wa_id,
            user_name: m.user_name,
            message: m.message || "",
            timestamp: m.timestamp,
            status: m.status,
            meta_msg_id: m.meta_msg_id || null,
            from: m.from || "",
            direction: m.direction || null,
            attachmentUrl: m.attachmentUrl || null,
            originalFileName: m.originalFileName || null,
            fileType: m.fileType || null,
            fileSize: m.fileSize || null,
            attachments: m.attachments || (m.attachmentUrl ? [{
                url: m.attachmentUrl,
                type: getFileTypeFromUrl(m.attachmentUrl),
                filename: getFileNameFromUrl(m.attachmentUrl),
                originalName: m.originalFileName || getFileNameFromUrl(m.attachmentUrl),
                mimeType: m.fileType,
                size: m.fileSize
            }] : [])
        }));

        return res.status(200).json(mappedMessages);
    } catch (error) {
        console.error("❌ Fetch messages error:", error);
        return res.status(500).json({ error: "Failed to fetch messages" });
    }
};

export const getUniqueContacts = async (req, res) => {
    try {
        const contacts = await Message.aggregate([
            { $sort: { timestamp: -1 } },
            {
                $group: {
                    _id: "$wa_id",
                    user_name: { $first: "$user_name" },
                    lastMessage: { $first: { $ifNull: ["$message", "📎 Attachment"] } },
                    lastMessageTime: { $first: "$timestamp" },
                },
            },
            { $sort: { lastMessageTime: -1 } },
        ]);

        const mapped = contacts.map((c) => ({
            wa_id: c._id,
            name: c.user_name || c._id,
            lastMessage: c.lastMessage || "",
            lastMessageTime: c.lastMessageTime || null,
            unreadCount: 0,
        }));

        return res.status(200).json(mapped);
    } catch (error) {
        console.error("❌ Contacts fetch error:", error);
        return res.status(500).json({ error: "Failed to fetch contacts" });
    }
};

export const sendMessage = async (req, res) => {
    try {
        // 🔍 DEBUG: Log incoming request
        console.log("🔍 DEBUG [sendMessage] Request body:", JSON.stringify(req.body, null, 2));
        console.log("🔍 DEBUG [sendMessage] Content-Type:", req.headers['content-type']);

        const {
            wa_id,
            message,
            user_name: incomingName,
            attachmentUrl,
            originalFileName,
            fileType,
            fileSize
        } = req.body;
        const BOT_NUMBER = process.env.BOT_NUMBER || "918329446654";

        // Validation
        if (!wa_id) {
            console.log("❌ Validation failed: wa_id is required");
            return res.status(400).json({ error: "wa_id is required" });
        }

        if (!message?.trim() && !attachmentUrl) {
            console.log("❌ Validation failed: Either message or attachmentUrl is required");
            return res.status(400).json({ error: "Either message or attachmentUrl is required" });
        }
        const cleanMessage = message ? sanitizeHtml(String(message).trim(), {
            allowedTags: [],
            allowedAttributes: {},
        }) : "";
        let contactDoc = await Message.findOne({ wa_id }).sort({ timestamp: -1 }).lean();
        const resolvedUserName = contactDoc?.user_name || incomingName || wa_id;
        const messageData = {
            wa_id,
            user_name: resolvedUserName,
            message: cleanMessage,
            attachmentUrl: attachmentUrl || null,
            originalFileName: originalFileName || null,
            fileType: fileType || null,
            fileSize: fileSize || null,
            status: "sent",
            timestamp: new Date(),
            from: BOT_NUMBER,
            direction: "outbound",
        };
        const newMsg = await Message.create(messageData);
        console.log("✅ Message saved successfully:", newMsg._id);
        const getFileTypeFromMimeType = (mime) => {
            if (!mime) return null;
            if (mime.startsWith('image/')) return 'image';
            if (mime.startsWith('video/')) return 'video';
            if (mime.startsWith('audio/')) return 'audio';
            if (mime === 'text/vcard' || mime === 'text/x-vcard') return 'contact';
            return null;
        };
        const attachmentObj = attachmentUrl ? {
            url: attachmentUrl,
            type: (fileType ? (getFileTypeFromMimeType(fileType) || getFileTypeFromUrl(attachmentUrl)) : getFileTypeFromUrl(attachmentUrl)),
            filename: getFileNameFromUrl(attachmentUrl),
            originalName: originalFileName || getFileNameFromUrl(attachmentUrl),
            mimeType: fileType || null,
            size: fileSize || null
        } : null;
        const io = req.app.get("io");
        if (io) {
            console.log("📡 Emitting new_message event:", newMsg._id);

            const socketPayload = {
                ...newMsg.toObject(),
                attachments: attachmentObj ? [attachmentObj] : []
            };

            io.emit("new_message", socketPayload);
        } else {
            console.log("⚠️ No socket.io instance found");
        }
        const responseData = {
            ...newMsg.toObject(),
            attachments: attachmentObj ? [attachmentObj] : []
        };

        console.log("🔍 DEBUG [sendMessage] Response data:", JSON.stringify(responseData, null, 2));

        return res.status(200).json({
            success: true,
            data: responseData
        });
    } catch (err) {
        console.error("❌ sendMessage Error:", err);
        console.error("❌ Error stack:", err.stack);

        if (err.name === 'ValidationError') {
            return res.status(400).json({
                error: "Validation failed",
                details: Object.values(err.errors).map(e => e.message),
                mongoError: err.message
            });
        }

        if (err.name === 'CastError') {
            return res.status(400).json({
                error: "Invalid data format",
                details: err.message
            });
        }

        return res.status(500).json({
            error: "Failed to send message",
            details: err.message
        });
    }
};
const getFileTypeFromUrl = (url) => {
    if (!url) return 'document';
    try {
        const ext = url.split('.').pop()?.toLowerCase() || '';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff'].includes(ext)) return 'image';
        if (['mp4', 'avi', 'mov', 'webm', 'mkv', '3gp'].includes(ext)) return 'video';
        if (['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(ext)) return 'audio';
        if (ext === 'vcf') return 'contact';
        if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(ext)) return 'document';
        return 'document';
    } catch (error) {
        console.warn("⚠️ Error determining file type:", error);
        return 'document';
    }
};

const getFileNameFromUrl = (url) => {
    if (!url) return 'File';
    try {
        return url.split('/').pop()?.split('?')[0] || 'File';
    } catch (error) {
        console.warn("⚠️ Error extracting filename:", error);
        return 'File';
    }
};
