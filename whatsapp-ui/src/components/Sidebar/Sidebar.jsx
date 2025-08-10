import { useState } from 'react';
import './Sidebar.css';
import Avatar from '../Avatar/Avatar';

const SearchIcon = () => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
    </svg>
);

const MoreVerticalIcon = () => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="1"></circle>
        <circle cx="12" cy="5" r="1"></circle>
        <circle cx="12" cy="19" r="1"></circle>
    </svg>
);

const formatTime = timestamp => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - date.getTime();
    if (diff < 86400000) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (diff < 604800000) {
        return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
};

function Sidebar({
    selectedContact,
    onSelect = () => { },
    isMobile = false,
    onClose = () => { },
    contacts = []
}) {
    const [searchTerm, setSearchTerm] = useState('');

    // cont by last msg time
    const sortedContacts = [...(contacts || [])].sort((a, b) => {
        const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
        const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
        return timeB - timeA;
    });


    const filteredContacts = sortedContacts.filter(c => {
        const name = c.name || '';
        const wa_id = c.wa_id || '';
        const term = searchTerm.toLowerCase();
        return name.toLowerCase().includes(term) || wa_id.includes(term);
    });

    return (
        <div className={`sidebar ${isMobile ? 'sidebar-mobile' : 'sidebar-desktop'}`}>
            <div className="sidebar-header">
                <div className="sidebar-header-left">
                    <div className="user-avatar">👤</div>
                    <h2 className="sidebar-title">Chats</h2>
                </div>
                <div className="sidebar-header-right">
                    <button className="header-button"><SearchIcon /></button>
                    <button className="header-button"><MoreVerticalIcon /></button>
                </div>
            </div>

            <div className="search-container">
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search or start new chat"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="contacts-list">
                {filteredContacts.length === 0 ? (
                    <div className="no-chats">
                        <div className="no-chats-emoji">💬</div>
                        <p className="no-chats-title">No chats found</p>
                        <p className="no-chats-subtitle">Start a conversation or search for contacts</p>
                    </div>
                ) : (
                    filteredContacts.map(contact => (
                        <div
                            key={contact.wa_id}
                            onClick={() => {
                                onSelect(contact);
                                if (isMobile) onClose();
                            }}
                            className={`contact-item ${selectedContact?.wa_id === contact.wa_id ? 'contact-item-selected' : ''}`}
                        >
                            <Avatar name={contact.name || ''} size="md" />
                            <div className="contact-info">
                                <div className="contact-header">
                                    <h3 className="contact-name">{contact.name || ''}</h3>
                                    <span className="contact-time">{formatTime(contact.lastMessageTime)}</span>
                                </div>
                                <div className="contact-message-row">
                                    <p className="contact-last-message">{contact.lastMessage || ''}</p>
                                    {contact.unreadCount > 0 && (
                                        <span className="unread-badge">{contact.unreadCount}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default Sidebar;

