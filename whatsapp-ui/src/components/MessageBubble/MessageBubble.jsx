import React, { useState } from "react";
import "./MessageBubble.css";
import {
    SingleTickIcon,
    DoubleTickGrayIcon,
    DoubleTickBlueIcon,
} from "../MessageStatusIcons/MessageStatusIcons";

const BOT_NUMBER = (import.meta.env.VITE_BOT_NUMBER || "918329446654").toString();

const formatTime = (timestamp) => {
    if (!timestamp) return "";
    try { return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); } catch { return ""; }
};

const getStatusIcon = (status) => {
    switch (status) {
        case "sending": return <div className="sending-indicator">⏳</div>;
        case "sent": return <SingleTickIcon />;
        case "delivered": return <DoubleTickGrayIcon />;
        case "read": return <DoubleTickBlueIcon />;
        case "failed": return <div className="failed-indicator">❌</div>;
        default: return null;
    }
};

const extractExt = (attachment) => {
    if (!attachment) return "";
    let name = "";
    if (typeof attachment === "object") {
        name = attachment.originalName || attachment.originalname || attachment.displayName || attachment.filename || (attachment.url || "");
    } else if (typeof attachment === "string") {
        name = attachment;
    } else {
        return "";
    }
    name = name.split("/").pop().split("?")[0] || name;
    const ext = name.split(".").pop()?.toLowerCase() || "";
    return ext;
};

const detectFileType = (attachment) => {
    if (!attachment) return "document";

    // Pref extensions
    const audioExts = ["mp3", "wav", "ogg", "m4a", "aac", "flac", "amr"];
    const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff"];
    const videoExts = ["mp4", "mov", "webm", "mkv", "avi", "3gp"];
    const docExts = ["pdf", "doc", "docx", "txt", "rtf", "xls", "xlsx"];

    const extFromName = extractExt(attachment);
    if (audioExts.includes(extFromName)) return "audio";
    if (imageExts.includes(extFromName)) return "image";
    if (videoExts.includes(extFromName)) return "video";
    if (extFromName === "vcf") return "contact";
    if (docExts.includes(extFromName)) return "document";

    if (typeof attachment === "object") {
        const t = (attachment.type || attachment.mimeType || attachment.mime_type || "").toString();
        if (t) {
            if (t.startsWith("image/")) return "image";
            if (t.startsWith("video/")) return "video";
            if (t.startsWith("audio/")) return "audio";
            if (t === "text/vcard" || t === "text/x-vcard") return "contact";
        }
        if (attachment.type && ["image", "video", "audio", "contact", "document"].includes(attachment.type)) return attachment.type;
    }

    const url = attachment?.url || (typeof attachment === "string" ? attachment : null);
    if (typeof url === "string") {
        const ext = url.split(".").pop()?.split("?")[0]?.toLowerCase() || "";
        if (audioExts.includes(ext)) return "audio";
        if (imageExts.includes(ext)) return "image";
        if (videoExts.includes(ext)) return "video";
        if (ext === "vcf") return "contact";
        if (docExts.includes(ext)) return "document";
    }

    try {
        const mime = (attachment && (attachment.mimeType || attachment.type || attachment.mime_type)) || null;
        if (mime && typeof mime === "string" && extFromName) {
            const mimeMain = mime.split("/")[0];
            if (audioExts.includes(extFromName) && mimeMain === "video") {
                console.warn("[MessageBubble] filename ext suggests audio but mime is video:", { filenameExt: extFromName, mime });
            }
            if (videoExts.includes(extFromName) && mimeMain === "audio") {
                console.warn("[MessageBubble] filename ext suggests video but mime is audio:", { filenameExt: extFromName, mime });
            }
        }
    } catch (e) {
    }

    return "document";
};

const filenameFromAttachment = (attachment) => {
    if (!attachment) return "File";
    if (typeof attachment === "object") {
        if (attachment.displayName) return attachment.displayName;
        if (attachment.originalName) return attachment.originalName;
        if (attachment.filename) return attachment.filename;
        if (attachment.url) return attachment.url.split("/").pop().split("?")[0];
    }
    if (typeof attachment === "string") return attachment.split("/").pop().split("?")[0];
    return "File";
};

const stripPrefix = (raw) => {
    if (!raw) return raw || "";
    const name = raw.split("/").pop().split("?")[0];
    const m = name.match(/^(?:(?:\d{6,})[_\-\s\.]*)+(.+)$/);
    if (m && m[1]) return m[1];
    const m2 = name.match(/^v\d+\/(.+)$/);
    if (m2 && m2[1]) return m2[1];
    return name;
};

const humanizeLabel = (raw) => {
    if (!raw) return raw || "";
    const noExt = raw.replace(/\.[^.]+$/, "");
    return noExt.replace(/[_\-\s]+/g, " ").replace(/\s+/g, " ").trim();
};

const getFileName = (attachment, fallback = "File") => {
    if (!attachment) return fallback;
    if (typeof attachment === "object" && attachment.displayName) return attachment.displayName;
    if (typeof attachment === "object" && attachment.originalName) return humanizeLabel(stripPrefix(attachment.originalName));
    const raw = filenameFromAttachment(attachment) || fallback;
    const stripped = stripPrefix(raw);
    return humanizeLabel(stripped || raw);
};

const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const parseVCardText = (text) => {
    const lines = text.split(/\r\n|\r|\n/);
    const results = [];
    let current = null;
    for (const l of lines) {
        if (!l) continue;
        const idx = l.indexOf(":");
        if (idx === -1) continue;
        const keyRaw = l.slice(0, idx).toUpperCase();
        const val = l.slice(idx + 1).trim();
        const key = keyRaw.split(";")[0];
        if (key === "BEGIN" && val.toUpperCase() === "VCARD") current = {};
        else if (key === "FN" && current !== null) current.fn = val;
        else if (key === "TEL" && current !== null) current.tel = val;
        else if (key === "END" && val.toUpperCase() === "VCARD" && current) { results.push(current); current = null; }
    }
    if (current && (current.fn || current.tel)) results.push(current);
    return results;
};

const AttachmentRenderer = ({ attachment, caption }) => {
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [videoError, setVideoError] = useState(false);
    const [contactModal, setContactModal] = useState({ open: false, contacts: [], fallbackName: null, fallbackTel: null, loading: false, error: null });
    const [downloading, setDownloading] = useState(false);

    const fileType = detectFileType(attachment);
    const url = (attachment && (attachment.url || attachment)) || null;
    const fileName = getFileName(attachment);
    const fileSize = attachment?.size ? formatFileSize(attachment.size) : "";

    const anchorDownload = (href, name) => {
        try {
            const a = document.createElement("a");
            a.href = href;
            a.download = name || "";
            document.body.appendChild(a);
            a.click();
            a.remove();
            return true;
        } catch (err) { console.warn("anchor download failed", err); return false; }
    };

    const handleDownload = async (e) => {
        e?.stopPropagation?.();
        if (!url) return;
        setDownloading(true);
        try {
            if (url.startsWith("blob:")) { anchorDownload(url, fileName); setDownloading(false); return; }
            try {
                const urlObj = new URL(url, window.location.href);
                if (urlObj.origin === window.location.origin) { if (anchorDownload(url, fileName)) { setDownloading(false); return; } }
            } catch { }
            const ext = (fileName.split(".").pop() || "").toLowerCase();
            const preferBlob = ["pdf", "doc", "docx", "txt", "rtf"].includes(ext);
            if (preferBlob) {
                try {
                    const resp = await fetch(url, { mode: "cors" });
                    if (resp.ok) {
                        const blob = await resp.blob();
                        const blobUrl = window.URL.createObjectURL(blob);
                        anchorDownload(blobUrl, fileName);
                        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 5000);
                        setDownloading(false);
                        return;
                    }
                } catch (err) { console.warn("blob fetch failed", err); }
            }
            if (!anchorDownload(url, fileName)) window.open(url, "_blank");
        } catch (err) { console.error("download failed", err); try { window.open(url, "_blank"); } catch { } } finally { setDownloading(false); }
    };

    const handleContactClick = async (e) => {
        e?.stopPropagation?.();
        if (!url) return;
        setContactModal({ open: true, contacts: [], fallbackName: null, fallbackTel: null, loading: true, error: null });
        try {
            const resp = await fetch(url, { mode: "cors" });
            if (!resp.ok) throw new Error(`Failed to fetch vcf (${resp.status})`);
            const text = await resp.text();
            const parsed = parseVCardText(text);
            if (parsed.length === 0) setContactModal({ open: true, contacts: [], fallbackName: fileName, fallbackTel: null, loading: false, error: null });
            else setContactModal({ open: true, contacts: parsed, fallbackName: null, fallbackTel: null, loading: false, error: null });
        } catch (err) {
            console.warn("Could not fetch/parse vcf", err);
            const inferred = humanizeLabel(filenameFromAttachment(attachment).replace(/^\d+[_\-\s\.]*/, ""));
            setContactModal({ open: true, contacts: [], fallbackName: inferred, fallbackTel: "(number not available)", loading: false, error: "Could not fetch vCard (CORS or network)" });
        }
    };

    const closeContactModal = () => setContactModal({ open: false, contacts: [], fallbackName: null, fallbackTel: null, loading: false, error: null });

    if (fileType === "image") {
        return (
            <>
                <div className="attachment-container image-attachment" onClick={() => !imageError && setImageModalOpen(true)}>
                    {!imageError ? (
                        <div className="image-preview-container">
                            <img src={url} alt={fileName} className="attachment-image" onError={() => setImageError(true)} loading="lazy" />
                            <div className="image-overlay"><span className="image-view-icon">🔍</span></div>
                        </div>
                    ) : (
                        <div className="image-error" onClick={handleDownload}>
                            <span className="error-icon">❌</span>
                            <div className="error-details"><div className="error-name">{fileName}</div><div className="error-message">Failed to load image</div></div>
                            <span className="download-icon">📥</span>
                        </div>
                    )}
                    {caption && <div className="attachment-caption">{caption}</div>}
                </div>

                {imageModalOpen && (
                    <div className="image-modal-overlay" onClick={() => setImageModalOpen(false)}>
                        <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
                            <button className="image-modal-close" onClick={() => setImageModalOpen(false)}>✕</button>
                            <img src={url} alt={fileName} className="image-modal-image" />
                            <div className="image-modal-footer">
                                <span>{fileName}</span>
                                <button className="image-modal-download" onClick={handleDownload}>Download</button>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    }

    if (fileType === "video") {
        return (
            <div className="attachment-container video-attachment">
                {!videoError ? (
                    <>
                        <div className="video-preview-container">
                            <video src={url} controls className="attachment-video" preload="metadata" onError={() => setVideoError(true)} poster={url ? `${url}#t=1` : undefined} />
                            <div className="video-info">
                                <span className="video-icon">🎬</span>
                                <div className="video-details"><div className="video-name">{fileName}</div>{fileSize && <div className="video-size">{fileSize}</div>}</div>
                                <button className="download-btn" onClick={handleDownload} disabled={downloading}>{downloading ? "..." : "📥"}</button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="video-error" onClick={handleDownload}>
                        <span className="error-icon">❌</span>
                        <div className="error-details"><div className="error-name">{fileName}</div><div className="error-message">Failed to load video</div>{fileSize && <div className="error-size">{fileSize}</div>}</div>
                        <span className="download-icon">📥</span>
                    </div>
                )}
                {caption && <div className="attachment-caption">{caption}</div>}
            </div>
        );
    }

    if (fileType === "audio") {
        return (
            <div className="attachment-container audio-attachment">
                <div className="audio-header">
                    <div className="audio-info"><span className="audio-icon">🎵</span><div className="audio-details"><div className="audio-name">{fileName}</div>{fileSize && <div className="audio-size">{fileSize}</div>}</div></div>
                    <button className="download-btn" onClick={handleDownload} disabled={downloading}>{downloading ? "..." : "📥"}</button>
                </div>
                <audio src={url} controls className="attachment-audio" preload="metadata" />
                {caption && <div className="attachment-caption">{caption}</div>}
            </div>
        );
    }

    if (fileType === "contact") {
        return (
            <>
                <div className="attachment-container contact-attachment">
                    <div className="contact-info" onClick={handleContactClick}>
                        <span className="contact-icon">👤</span>
                        <div className="contact-details"><div className="contact-name">{fileName.replace(/\.vcf$/i, "")}</div><div className="contact-type">Contact Card</div></div>
                        <span className="download-icon">📥</span>
                    </div>
                    {caption && <div className="attachment-caption">{caption}</div>}
                </div>

                {contactModal.open && (
                    <div className="contact-detail-overlay" onClick={closeContactModal}>
                        <div className="contact-detail-modal" onClick={(e) => e.stopPropagation()}>
                            <button className="contact-detail-close" onClick={closeContactModal}>✕</button>
                            <div className="contact-detail-body">
                                {contactModal.loading ? (
                                    <div>Loading...</div>
                                ) : contactModal.error ? (
                                    <div className="contact-error">
                                        <div className="contact-fallback-name">{contactModal.fallbackName}</div>
                                        <div className="contact-fallback-tel">{contactModal.fallbackTel}</div>
                                        <div className="contact-error-note">{contactModal.error}</div>
                                    </div>
                                ) : contactModal.contacts.length ? (
                                    contactModal.contacts.map((c, idx) => (
                                        <div key={idx} className="contact-entry">
                                            <div className="contact-entry-name">{c.fn || "(no name)"}</div>
                                            <div className="contact-entry-tel">{c.tel || "(no number)"}</div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="contact-fallback">
                                        <div className="contact-fallback-name">{contactModal.fallbackName || fileName}</div>
                                        <div className="contact-fallback-tel">{contactModal.fallbackTel || "(number not available)"}</div>
                                    </div>
                                )}
                            </div>

                            <div className="contact-detail-actions">
                                <a className="contact-download-btn" href={url} target="_blank" rel="noreferrer">Open / Download</a>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    }

    return (
        <div className="attachment-container document-attachment">
            <div className="document-info" onClick={handleDownload} role="button" tabIndex={0} onKeyPress={(e) => { if (e.key === "Enter") handleDownload(e); }}>
                <span className="document-icon">{fileName.toLowerCase().endsWith(".pdf") ? "📄" : "📁"}</span>
                <div className="document-details">
                    <div className="document-name">{fileName}</div>
                    <div className="document-type">{fileName.toLowerCase().endsWith(".pdf") ? "PDF Document" : "Document"}{fileSize && ` • ${fileSize}`}</div>
                </div>
                <span className="download-icon">{downloading ? "..." : "📥"}</span>
            </div>
            {caption && <div className="attachment-caption">{caption}</div>}
        </div>
    );
};

// --- msg buble----
const MessageBubble = ({ message }) => {
    const fromNumber = message.from?.toString() || "";
    const direction = fromNumber === BOT_NUMBER ? "outbound" : "inbound";

    let attachments = [];
    if (Array.isArray(message.attachments) && message.attachments.length > 0) {
        attachments = message.attachments;
    } else if (message.attachmentUrl || message.fileUrl) {
        const url = message.attachmentUrl || message.fileUrl;
        const filename = message.originalFileName || message.filename || (typeof url === "string" ? url.split("/").pop() : url);
        attachments = [{ url, filename, originalName: message.originalFileName || null }];
    } else if (message.attachmentUrl && typeof message.attachmentUrl === "string") {
        attachments = [message.attachmentUrl];
    }

    const hasAttachments = attachments.length > 0;
    const caption = message.message || "";

    return (
        <div className={`message-container ${direction}`}>
            <div className={`message-bubble ${direction} ${hasAttachments ? "has-attachments" : ""} ${message.status === "failed" ? "message-failed" : ""}`}>
                {hasAttachments && (
                    <div className="message-attachments">
                        {attachments.map((att, idx) => (
                            <AttachmentRenderer key={`${message._id || idx}-att-${idx}-${getFileName(att)}`} attachment={att} caption={attachments.length === 1 ? caption : undefined} />
                        ))}
                    </div>
                )}

                {(!hasAttachments || (hasAttachments && attachments.length > 1)) && message.message && (
                    <div className="message-text">{message.message}</div>
                )}

                {message.status === "failed" && (
                    <div className="message-error"><span className="error-icon">⚠️</span><span className="error-text">{message.error || "Failed to send"}</span></div>
                )}

                <div className="message-footer">
                    <span className="message-time">{formatTime(message.timestamp)}</span>
                    {direction === "outbound" && (<div className="message-status">{getStatusIcon(message.status)}</div>)}
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;
