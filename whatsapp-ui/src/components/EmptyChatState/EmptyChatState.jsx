import './EmptyChatState.css';

const EmptyChatState = ({ isMobile }) => {
    return (
        <div className={`empty-chat-container ${isMobile ? 'mobile' : 'desktop'}`}>
            <div className="empty-chat-content">
                <div className="empty-chat-icon">
                    <svg viewBox="0 0 303 172" className="whatsapp-icon" xmlns="http://www.w3.org/2000/svg">
                        <path fill="currentColor" d="M87.8 139.5L96.7 130.4L80.4 114.6C73.4 107.6 73.4 96.6 80.4 89.6L96.7 73.8L87.8 64.7L66.2 86.3C55.4 97.1 55.4 114.1 66.2 124.9L87.8 139.5Z" />
                        <path fill="currentColor" d="M148.3 64.7L139.4 73.8L155.7 89.6C162.7 96.6 162.7 107.6 155.7 114.6L139.4 130.4L148.3 139.5L169.9 124.9C180.7 114.1 180.7 97.1 169.9 86.3L148.3 64.7Z" />
                        <path fill="currentColor" d="M118.1 58.9L108.8 62.7L124.6 151.8L133.9 148L118.1 58.9Z" />
                    </svg>
                </div>
                <h1 className="empty-chat-title">WhatsApp Web</h1>
                <p className="empty-chat-description">
                    Send and receive messages without keeping your phone online.<br />
                    Use WhatsApp on up to 4 linked devices and 1 phone at the same time.
                </p>
                <div className="empty-chat-encrypted">
                    <svg className="lock-icon" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM11 7H13V13H11V7ZM11 15H13V17H11V15Z" />
                    </svg>
                    End-to-end encrypted
                </div>
            </div>
        </div>
    );
};

export default EmptyChatState;
