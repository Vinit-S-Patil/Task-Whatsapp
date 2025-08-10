import { useRef, useState, useEffect } from 'react';
import './MessageInput.css';
import EmojiPicker from 'emoji-picker-react';
import { validateFile } from '../../api/index';

const SmileIcon = () => (
    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9" y2="9" />
        <line x1="15" y1="9" x2="15" y2="9" />
    </svg>
);

const PaperclipIcon = () => (
    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21.44 11.05L12.27 20.22a5 5 0 0 1-7.07-7.07L15.17 3.17a3 3 0 1 1 4.24 4.24L8.93 18.89" />
    </svg>
);

const MicIcon = () => (
    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 1a3 3 0 0 1 3 3v8a3 3 0 0 1-6 0V4a3 3 0 0 1 3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
);

const SendIcon = () => (
    <svg className="send-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
);

const getIdKey = (c) => String(c?.wa_id || c?.id || c?.phone || c?._id || c?.email || '');

const MessageInput = ({ inputValue, setInputValue, onSend, contact, allContacts = [] }) => {
    const inputRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const fileInputRef = useRef(null);
    const docInputRef = useRef(null);
    const audioInputRef = useRef(null);

    // cont pick
    const [showContactPicker, setShowContactPicker] = useState(false);
    const [selectedContactIds, setSelectedContactIds] = useState(new Set());
    const [contactSearch, setContactSearch] = useState('');

    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                emojiPickerRef.current &&
                !emojiPickerRef.current.contains(event.target) &&
                !event.target.closest('.emoji-toggle-btn')
            ) {
                setShowEmojiPicker(false);
            }
            if (!event.target.closest('.attach-menu') && !event.target.closest('.attach-toggle-btn')) {
                setShowAttachMenu(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    useEffect(() => {
        if (uploadError && inputValue) setUploadError(null);
    }, [inputValue, uploadError]);

    const handleKeyPress = e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!isUploading) onSend && onSend();
        }
    };

    const onEmojiClick = (emojiObject) => {
        setInputValue(prev => prev + emojiObject.emoji);
        inputRef.current?.focus();
    };

    const buildVCardBlob = (contactsArray) => {
        if (!contactsArray || contactsArray.length === 0) return null;

        const vcardParts = contactsArray.map(c => {
            const name = (c.name || c.displayName || '').replace(/\r\n|\r|\n/g, ' ');
            const tel = (c.wa_id || c.phone || '').toString().replace(/[^\d+]/g, '');
            const lines = [
                'BEGIN:VCARD',
                'VERSION:3.0',
                `FN:${name || tel || 'contact'}`,
            ];
            if (tel) lines.push(`TEL:${tel}`);
            if (c.email) lines.push(`EMAIL:${c.email}`);
            if (c.org) lines.push(`ORG:${c.org}`);
            lines.push('END:VCARD');
            return lines.join('\r\n');
        });

        const full = vcardParts.join('\r\n');
        try {
            const blob = new Blob([full], { type: 'text/vcard' });
            return blob;
        } catch (err) {
            console.error('Failed to create vCard blob', err);
            return null;
        }
    };

    const handleSendSelectedContacts = async () => {
        if (!contact) {
            setUploadError('No chat selected');
            return;
        }

        const selected = allContacts.filter(c => selectedContactIds.has(getIdKey(c)));
        if (selected.length === 0) {
            setUploadError('Please select at least one contact');
            return;
        }

        const blob = buildVCardBlob(selected);
        if (!blob) {
            setUploadError('Failed to create vCard');
            return;
        }

        const firstName = (selected[0].name || selected[0].displayName || 'contacts').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20) || 'contacts';
        const fileName = `${Date.now()}_${firstName}.vcf`;
        const file = new File([blob], fileName, { type: 'text/vcard' });

        try {
            setIsUploading(true);
            setShowContactPicker(false);
            await handlePickFile(file);
            setSelectedContactIds(new Set());
            setContactSearch('');
        } catch (err) {
            console.error('Error sending vCard', err);
            setUploadError(err.message || 'Failed to send contact');
        } finally {
            setIsUploading(false);
        }
    };

    const handlePickFile = async (file) => {
        if (!file || !contact || isUploading) return;

        setUploadError(null);

        const validation = validateFile(file, 10);
        if (!validation.isValid) {
            setUploadError(validation.error);
            return;
        }

        try {
            setIsUploading(true);
            setShowAttachMenu(false);
            await onSend?.(file);
            setInputValue('');
        } catch (error) {
            console.error('File upload error:', error);
            setUploadError(error.message || 'Failed to upload file');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSendClick = async () => {
        if (isUploading) return;
        try {
            await onSend?.();
        } catch (error) {
            console.error('Send message error:', error);
            setUploadError('Failed to send message');
        }
    };

    const toggleContactSelection = (idKey) => {
        setSelectedContactIds(prev => {
            const next = new Set(prev);
            if (next.has(idKey)) next.delete(idKey);
            else next.add(idKey);
            return next;
        });
    };

    const visibleContacts = allContacts.filter(c => {
        if (!contactSearch) return true;
        const q = contactSearch.toLowerCase();
        const name = (c.name || c.displayName || '').toLowerCase();
        const phone = (c.wa_id || c.phone || '').toString().toLowerCase();
        return name.includes(q) || phone.includes(q);
    });

    return (
        <div className="message-input-container">
            {uploadError && (
                <div className="upload-error">
                    <span className="error-icon">⚠️</span>
                    <span className="error-text">{uploadError}</span>
                    <button className="error-close" onClick={() => setUploadError(null)} aria-label="Close error">×</button>
                </div>
            )}

            {isUploading && (
                <div className="upload-progress">
                    <div className="upload-spinner"></div>
                    <span>Uploading...</span>
                </div>
            )}

            <div className="message-input-row">
                <button className="input-button emoji-toggle-btn" type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} disabled={isUploading} aria-label="Emoji">
                    <SmileIcon />
                </button>

                <div style={{ position: 'relative' }}>
                    <button className={`input-button attach-toggle-btn ${isUploading ? 'disabled' : ''}`} type="button" onClick={() => !isUploading && setShowAttachMenu(v => !v)} disabled={isUploading} aria-label="Attach">
                        <PaperclipIcon />
                    </button>

                    {showAttachMenu && !isUploading && (
                        <div className="attach-menu">
                            <button type="button" onClick={() => docInputRef.current?.click()} className="attach-menu-item"><span className="attach-icon">📄</span> Document</button>
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="attach-menu-item"><span className="attach-icon">🖼️</span> Photos & Videos</button>
                            <button type="button" onClick={() => audioInputRef.current?.click()} className="attach-menu-item"><span className="attach-icon">🎵</span> Audio</button>

                            <button type="button" onClick={() => { setShowContactPicker(true); setShowAttachMenu(false); }} className="attach-menu-item">
                                <span className="attach-icon">👤</span> Contact
                            </button>
                        </div>
                    )}
                </div>

                <div className="text-input-container">
                    <textarea
                        ref={inputRef}
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="message-textarea"
                        placeholder={isUploading ? "Uploading..." : "Type a message"}
                        rows="1"
                        disabled={isUploading}
                    />
                </div>

                {inputValue.trim() ? (
                    <button onClick={handleSendClick} className={`send-button ${isUploading ? 'disabled' : ''}`} disabled={isUploading} aria-label="Send">
                        <SendIcon />
                    </button>
                ) : (
                    <button className="input-button" disabled={isUploading} aria-label="Record">
                        <MicIcon />
                    </button>
                )}
            </div>

            {showEmojiPicker && !isUploading && (
                <div className="emoji-picker-container" ref={emojiPickerRef}>
                    <EmojiPicker onEmojiClick={onEmojiClick} />
                </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handlePickFile(f); e.target.value = ''; }} />
            <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.rtf" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handlePickFile(f); e.target.value = ''; }} />
            <input ref={audioInputRef} type="file" accept="audio/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handlePickFile(f); e.target.value = ''; }} />

            {/* Cont pick.r */}
            {showContactPicker && (
                <div className="contact-picker-overlay" onClick={() => setShowContactPicker(false)}>
                    <div className="contact-picker-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="contact-picker-header">
                            <h3>Select contacts to share</h3>
                            <div>
                                <input className="contact-search" placeholder="Search contacts" value={contactSearch} onChange={(e) => setContactSearch(e.target.value)} />
                            </div>
                            <button className="contact-picker-close" onClick={() => setShowContactPicker(false)}>✕</button>
                        </div>

                        <div className="contact-picker-list">
                            {visibleContacts.length === 0 ? (
                                <div className="contact-empty">No contacts found</div>
                            ) : (
                                visibleContacts.map((c) => {
                                    const id = getIdKey(c);
                                    const checked = selectedContactIds.has(id);
                                    return (
                                        <label key={id} className="contact-row">
                                            <input type="checkbox" checked={checked} onChange={() => toggleContactSelection(id)} />
                                            <div className="contact-meta">
                                                <div className="contact-name">{c.name || c.displayName || id}</div>
                                                <div className="contact-phone">{c.wa_id || c.phone || ''}</div>
                                            </div>
                                        </label>
                                    );
                                })
                            )}
                        </div>

                        <div className="contact-picker-actions">
                            <button className="contact-cancel" onClick={() => { setShowContactPicker(false); setSelectedContactIds(new Set()); }} disabled={isUploading}>Cancel</button>
                            <button className="contact-send" onClick={handleSendSelectedContacts} disabled={isUploading || selectedContactIds.size === 0}>
                                {isUploading ? 'Sending…' : `Send (${selectedContactIds.size})`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessageInput;
