export const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const diff = now - timestamp;

    if (diff < 1000 * 60 * 60 * 24) {
        return timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
    } else if (diff < 1000 * 60 * 60 * 24 * 7) {
        return timestamp.toLocaleDateString([], { weekday: 'short' });
    } else {
        return timestamp.toLocaleDateString([], {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        });
    }
};