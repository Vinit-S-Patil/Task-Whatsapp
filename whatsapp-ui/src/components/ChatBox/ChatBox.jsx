import { useState, useEffect, useRef } from 'react';
import './ChatBox.css';
import ChatHeader from '../ChatHeader/ChatHeader';
import MessageBubble from '../MessageBubble/MessageBubble';
import MessageInput from '../MessageInput/MessageInput';
import EmptyChatState from '../EmptyChatState/EmptyChatState';
import socket from '../../socket';

// srch 

const SearchBar = ({ searchQuery, setSearchQuery, onClose, searchResults, currentResultIndex, onNavigateResult }) => {
    const searchInputRef = useRef(null);

    useEffect(() => {
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, []);

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            onClose();
        } else if (e.key === 'Enter' && searchResults.length > 0) {
            e.preventDefault();
            if (e.shiftKey) {
                onNavigateResult('prev');
            } else {
                onNavigateResult('next');
            }
        }
    };

    return (
        <div className="search-bar">
            <div className="search-input-container">
                <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="search-input"
                />
                <button onClick={onClose} className="search-close-btn" aria-label="Close search">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>
            {searchQuery && (
                <div className="search-results-info">
                    {searchResults.length > 0 ? (
                        <>
                            <span className="search-count">
                                {currentResultIndex + 1} of {searchResults.length}
                            </span>
                            <div className="search-navigation">
                                <button
                                    onClick={() => onNavigateResult('prev')}
                                    disabled={searchResults.length === 0}
                                    className="search-nav-btn"
                                    title="Previous result (Shift+Enter)"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="15,18 9,12 15,6" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => onNavigateResult('next')}
                                    disabled={searchResults.length === 0}
                                    className="search-nav-btn"
                                    title="Next result (Enter)"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="9,18 15,12 9,6" />
                                    </svg>
                                </button>
                            </div>
                        </>
                    ) : (
                        <span className="search-count">No results found</span>
                    )}
                </div>
            )}
        </div>
    );
};

function ChatBox({
    contact,
    hideHeader = false,
    isMobile,
    onBackClick,
    messages = [],
    setMessagesForContact,
    onSendMessage,
    contacts = []
}) {
    const [inputValue, setInputValue] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [currentResultIndex, setCurrentResultIndex] = useState(0);
    const [highlightedMessageId, setHighlightedMessageId] = useState(null);

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);


    // auto scrol new msg no proper work
    useEffect(() => {
        if (!isSearchOpen) {
            scrollToBottom();
        }
    }, [messages, isSearchOpen]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            setCurrentResultIndex(0);
            setHighlightedMessageId(null);
            return;
        }

        const query = searchQuery.toLowerCase().trim();
        const results = [];

        messages.forEach((message, index) => {
            let hasMatch = false;

            if (message.message && message.message.toLowerCase().includes(query)) {
                hasMatch = true;
            }

            if (message.attachments && Array.isArray(message.attachments)) {
                message.attachments.forEach(attachment => {
                    const fileName = getFileName(attachment).toLowerCase();
                    if (fileName.includes(query)) {
                        hasMatch = true;
                    }
                });
            }

            if (message.originalFileName && message.originalFileName.toLowerCase().includes(query)) {
                hasMatch = true;
            }

            if (hasMatch) {
                results.push({
                    messageIndex: index,
                    messageId: message._id || `${index}-${String(message.timestamp || '')}`,
                    message: message
                });
            }
        });

        setSearchResults(results);
        setCurrentResultIndex(0);

        // fonud msg indicat

        if (results.length > 0) {
            setHighlightedMessageId(results[0].messageId);
            scrollToMessage(results[0].messageId);
        } else {
            setHighlightedMessageId(null);
        }
    }, [searchQuery, messages]);

    const getFileName = (attachment, fallback = "File") => {
        if (!attachment) return fallback;
        if (typeof attachment === "object" && attachment.displayName) return attachment.displayName;
        if (typeof attachment === "object" && attachment.originalName) return attachment.originalName;
        if (typeof attachment === "object" && attachment.filename) return attachment.filename;
        if (typeof attachment === "object" && attachment.url) return attachment.url.split("/").pop().split("?")[0];
        if (typeof attachment === "string") return attachment.split("/").pop().split("?")[0];
        return fallback;
    };

    const scrollToMessage = (messageId) => {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement && messagesContainerRef.current) {
            messageElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });

            messageElement.classList.add('search-highlighted');
            setTimeout(() => {
                messageElement.classList.remove('search-highlighted');
            }, 2000);
        }
    };

    const handleNavigateResult = (direction) => {
        if (searchResults.length === 0) return;

        let newIndex = currentResultIndex;
        if (direction === 'next') {
            newIndex = (currentResultIndex + 1) % searchResults.length;
        } else if (direction === 'prev') {
            newIndex = currentResultIndex === 0 ? searchResults.length - 1 : currentResultIndex - 1;
        }

        setCurrentResultIndex(newIndex);
        const result = searchResults[newIndex];
        setHighlightedMessageId(result.messageId);
        scrollToMessage(result.messageId);
    };

    const handleSearchToggle = () => {
        setIsSearchOpen(!isSearchOpen);
        if (isSearchOpen) {
            setSearchQuery('');
            setSearchResults([]);
            setCurrentResultIndex(0);
            setHighlightedMessageId(null);
        }
    };

    const handleSearchClose = () => {
        setIsSearchOpen(false);
        setSearchQuery('');
        setSearchResults([]);
        setCurrentResultIndex(0);
        setHighlightedMessageId(null);
    };

    const highlightText = (text, query) => {
        if (!query || !text) return text;

        const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
        return parts.map((part, index) =>
            part.toLowerCase() === query.toLowerCase()
                ? <mark key={index} className="search-highlight">{part}</mark>
                : part
        );
    };

    useEffect(() => {
        if (!contact) return;

        const onStatus = ({ meta_msg_id, status, _id }) => {
            if (typeof setMessagesForContact === 'function') {
                setMessagesForContact(
                    messages.map((m) =>
                        m._id === _id || m.meta_msg_id === meta_msg_id ? { ...m, status } : m
                    )
                );
            }
        };

        socket.on('message_status_updated', onStatus);
        return () => {
            socket.off('message_status_updated', onStatus);
        };
    }, [contact, messages, setMessagesForContact]);

    const handleSend = (file = null) => {
        const cleanText = inputValue.trim();
        if (!cleanText && !file) return;
        if (!contact) return;

        const payload = {
            wa_id: contact.wa_id,
            message: cleanText || '',
            timestamp: new Date().toISOString(),
            status: 'sent',
            user_name: contact.name
        };

        const sendPromise = onSendMessage?.(payload, file);

        if (sendPromise && typeof sendPromise.then === 'function') {
            sendPromise.catch(err => {
                console.error('Send failed (async):', err);
            });
        }

        setInputValue('');
    };

    if (!contact) {
        return <EmptyChatState isMobile={isMobile} />;
    }

    return (
        <div className={`chatbox ${isMobile ? 'chatbox-mobile' : 'chatbox-desktop'}`}>
            {!hideHeader && (
                <ChatHeader
                    contact={contact}
                    isMobile={isMobile}
                    onBackClick={onBackClick}
                    onSearchToggle={handleSearchToggle}
                    isSearchOpen={isSearchOpen}
                />
            )}

            {isSearchOpen && (
                <SearchBar
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    onClose={handleSearchClose}
                    searchResults={searchResults}
                    currentResultIndex={currentResultIndex}
                    onNavigateResult={handleNavigateResult}
                />
            )}

            <div className="messages-container" ref={messagesContainerRef}>
                {messages.map((msg, idx) => {
                    const messageId = msg._id || `${idx}-${String(msg.timestamp || '')}`;
                    const isHighlighted = highlightedMessageId === messageId;

                    const enhancedMessage = searchQuery && msg.message
                        ? { ...msg, message: highlightText(msg.message, searchQuery.trim()) }
                        : msg;

                    return (
                        <div
                            key={messageId}
                            data-message-id={messageId}
                            className={isHighlighted ? 'message-search-active' : ''}
                        >
                            <MessageBubble message={enhancedMessage} />
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <MessageInput
                inputValue={inputValue}
                setInputValue={setInputValue}
                onSend={handleSend}
                contact={contact}
                allContacts={contacts}
            />
        </div>
    );
}

export default ChatBox;