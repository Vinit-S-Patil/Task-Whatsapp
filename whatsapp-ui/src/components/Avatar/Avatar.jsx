import './Avatar.css';

const Avatar = ({ name = '', size = "md" }) => {
    const initials = name
        .split(' ')
        .filter(Boolean)
        .map(w => w[0].toUpperCase())
        .slice(0, 2)
        .join('');

    return (
        <div className={`avatar avatar-${size}`}>
            <div className="avatar-circle">
                <span className="avatar-text">
                    {initials || '?'}
                </span>
            </div>
        </div>
    );
};

export default Avatar;
