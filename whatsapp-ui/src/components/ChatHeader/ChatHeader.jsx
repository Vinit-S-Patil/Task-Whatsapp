import './ChatHeader.css';
import Avatar from '../Avatar/Avatar';

const SearchIcon = () => (
    <svg className="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

const MoreVerticalIcon = () => (
    <svg className="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="5" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="12" cy="19" r="1" />
    </svg>
);

const PhoneIcon = () => (
    <svg className="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.86 19.86 0 0 1 3.1 5.18 2 2 0 0 1 5 3h3a2 2 0 0 1 2 1.72 12.05 12.05 0 0 0 .6 2.54 2 2 0 0 1-.45 2.11l-1.27 1.27a16 16 0 0 0 6.28 6.28l1.27-1.27a2 2 0 0 1 2.11-.45 12.05 12.05 0 0 0 2.54.6A2 2 0 0 1 22 16.92z" />
    </svg>
);

const VideoIcon = () => (
    <svg className="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
);

const ArrowLeftIcon = () => (
    <svg className="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12,19 5,12 12,5" />
    </svg>
);

const ChatHeader = ({ contact, isMobile, onBackClick, onSearchToggle, isSearchOpen }) => {
    return (
        <div className="chat-header">
            {isMobile && (
                <button onClick={onBackClick} className="back-button" aria-label="Back">
                    <ArrowLeftIcon />
                </button>
            )}
            <Avatar name={contact?.name} size="sm" />
            <div className="contact-details">
                <h3 className="contact-name-header">{contact?.name}</h3>
                <p className="contact-status">+{contact?.wa_id}</p>
            </div>
            <div className="header-actions">
                <button className="header-action-button vid" title="Video"><VideoIcon /></button>
                <button className="header-action-button" title="Call"><PhoneIcon /></button>

                <button
                    className={`header-action-button ${isSearchOpen ? 'active' : ''}`}
                    onClick={onSearchToggle}
                    title="Search messages"
                    aria-label="Search"
                >
                    <SearchIcon />
                </button>

                <button className="header-action-button" title="More"><MoreVerticalIcon /></button>
            </div>
        </div>
    );
};

export default ChatHeader;
