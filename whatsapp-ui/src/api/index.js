import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;


// lg dbug
const logDebug = (label, data) => {
    console.log(`🔍 DEBUG [${label}]:`, data);
};



// all of th e unique cont:

export const getAllContacts = async () => {
    try {
        const res = await axios.get(`${BASE_URL}/contacts`);
        return res.data.map((c) => ({
            wa_id: c.wa_id,
            name: c.name?.trim() || c.wa_id,
            lastMessage: c.lastMessage || "",
            lastMessageTime: c.lastMessageTime,
            unreadCount: c.unreadCount || 0,
        }));
    } catch (err) {
        console.error("❌ Failed to fetch contacts:", err);
        return [];
    }
};







// msg histo by wa_id:

export const getMessagesByWaId = async (wa_id) => {
    try {
        const res = await axios.get(`${BASE_URL}/messages/${wa_id}`);
        return res.data.map((m) => ({
            _id: m._id,
            wa_id: m.wa_id,
            from: m.from || "",
            message: m.message,
            timestamp: m.timestamp,
            status: m.status,
            direction: m.direction || null,
            user_name: m.user_name,
            attachmentUrl: m.attachmentUrl || null,
            attachments: m.attachments || (m.attachmentUrl ? [{
                url: m.attachmentUrl,
                type: getFileTypeFromUrl(m.attachmentUrl),
                filename: getFileNameFromUrl(m.attachmentUrl),
                originalName: m.originalFileName || getFileNameFromUrl(m.attachmentUrl)
            }] : [])
        }));
    } catch (err) {
        console.error("❌ Failed to fetch messages:", err);
        return [];
    }
};




const getFileTypeFromUrl = (url) => {
    if (!url) return 'unknown';
    const ext = url.split('.').pop()?.toLowerCase() || '';

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    if (['mp4', 'avi', 'mov', 'webm', 'mkv'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(ext)) return 'audio';
    if (ext === 'vcf') return 'contact';
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) return 'document';

    return 'document';
};




const getFileNameFromUrl = (url) => {
    if (!url) return 'File';
    return url.split('/').pop()?.split('?')[0] || 'File';
};





// Sent a mes for txt onl:

export const sendMessage = async (wa_id, message, user_name) => {
    try {
        logDebug("sendMessage Request", { wa_id, message, user_name });

        const res = await axios.post(`${BASE_URL}/send`, {
            wa_id,
            message,
            user_name,
        });

        logDebug("sendMessage Response", res.data);
        return res.data.data;
    } catch (err) {
        console.error("❌ Failed to send message:", err);
        if (err.response) {
            console.error("❌ Response data:", err.response.data);
            console.error("❌ Response status:", err.response.status);
        }
        return null;
    }
};





// cloudnry file upload real names:

export const uploadToCloudinary = async (file) => {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
        throw new Error('Cloudinary configuration missing');
    }

    logDebug("Cloudinary Upload", {
        cloudName: CLOUDINARY_CLOUD_NAME,
        preset: CLOUDINARY_UPLOAD_PRESET,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
    });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    formData.append("public_id", `uploads/${Date.now()}_${cleanFileName}`);

    if (file.type.startsWith('video/')) {
        formData.append("resource_type", "video");
    } else if (file.type.startsWith('audio/')) {
        formData.append("resource_type", "video");
    } else if (file.type === 'application/pdf') {
        formData.append("resource_type", "image");
    } else {
        formData.append("resource_type", "auto");
    }

    const uploadRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
        formData,
        {
            onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total
                );
                console.log(`Upload progress: ${percentCompleted}%`);
            }
        }
    );

    return {
        url: uploadRes.data.secure_url,
        originalFileName: file.name,
        cloudinaryData: uploadRes.data
    };
};






// upld to cloudnry 1st:

export const sendMessageWithAttachment = async (wa_id, message, user_name, file) => {
    try {
        let attachmentUrl = null;
        let originalFileName = null;

        if (file) {
            console.log(`📤 Uploading ${file.name} to Cloudinary...`);
            const uploadResult = await uploadToCloudinary(file);
            attachmentUrl = uploadResult.url;
            originalFileName = uploadResult.originalFileName;
            console.log(`✅ Upload successful: ${attachmentUrl}`);
        }

        const payload = {
            wa_id,
            message: message || '',
            user_name,
            attachmentUrl,
            originalFileName,
            fileType: file?.type,
            fileSize: file?.size
        };

        logDebug("sendMessageWithAttachment Payload", payload);

        const res = await axios.post(`${BASE_URL}/send`, payload);

        logDebug("sendMessageWithAttachment Response", res.data);
        return res.data.data;
    } catch (err) {
        console.error(" Failed to send message and attachment:", err);

        if (err.response) {
            console.error("Backend Response Status:", err.response.status);
            console.error(" Backend Response Data:", err.response.data);
            console.error(" Backend Response Headers:", err.response.headers);
        } else if (err.request) {
            console.error(" No response received:", err.request);
        } else {
            console.error(" Error setting up request:", err.message);
        }

        // Cloudinry error only if
        if (err.response?.status === 400 && err.response?.data?.error?.message) {
            throw new Error(`Upload failed: ${err.response.data.error.message}`);
        }

        throw err;
    }
};








// files type validata

export const getSupportedFileTypes = () => {
    return {
        images: [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff'
        ],
        videos: [
            'video/mp4', 'video/webm', 'video/mov', 'video/avi', 'video/mkv', 'video/3gp', 'video/quicktime'
        ],
        audio: [
            'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac', 'audio/flac', 'audio/wma'
        ],
        documents: [
            'application/pdf',
            'text/plain',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/rtf',
            'text/csv'
        ],
        contacts: ['text/vcard', 'text/x-vcard']
    };
};







// file valida bef  upl

export const validateFile = (file, maxSizeInMB = 25) => {
    const supportedTypes = getSupportedFileTypes();
    const allSupportedTypes = [
        ...supportedTypes.images,
        ...supportedTypes.videos,
        ...supportedTypes.audio,
        ...supportedTypes.documents,
        ...supportedTypes.contacts
    ];

    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
        return { isValid: false, error: `File size must be less than ${maxSizeInMB}MB` };
    }

    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.split('.').pop();

    if (file.type === 'application/octet-stream' || !file.type) {
        const extensionTypeMap = {
            'pdf': 'application/pdf',
            'mp3': 'audio/mpeg',
            'mp4': 'video/mp4',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        };

        if (extensionTypeMap[fileExtension]) {
            return { isValid: true };
        }
    }

    const isSupported = allSupportedTypes.includes(file.type);

    if (!isSupported) {
        return {
            isValid: false,
            error: `File type "${file.type}" not supported. Supported types: Images, Videos, Audio, PDF, Documents, Contacts`
        };
    }

    return { isValid: true };
};