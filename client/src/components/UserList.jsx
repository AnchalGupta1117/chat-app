import { useState } from 'react';

export default function UserList({ users, selectedId, onSelect, onRemove }) {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <div className="user-list">
      <div className="list-header">People</div>
      {users.length === 0 && <div className="empty">No other users yet.</div>}
      {users.map((user) => (
        <div
          key={user.id || user._id}
          style={{ position: 'relative' }}
          onMouseEnter={() => setHoveredId(user.id || user._id)}
          onMouseLeave={() => setHoveredId(null)}
        >
          <button
            className={`user-row ${selectedId === (user.id || user._id) ? 'selected' : ''}`}
            onClick={() => onSelect({ ...user, id: user.id || user._id })}
          >
            <div className="avatar" aria-hidden>
              {user.name?.slice(0, 1)?.toUpperCase() || '?'}
            </div>
            <div className="user-meta">
              <div className="user-name">{user.name}</div>
              <div className="user-email">{user.email}</div>
            </div>
            <span className={`status-dot ${user.online ? 'online' : 'offline'}`} aria-label={user.online ? 'online' : 'offline'} />
          </button>
          {hoveredId === (user.id || user._id) && onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(user._id || user.id);
              }}
              style={{
                position: 'absolute',
                right: '0.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '0.3rem 0.6rem',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer',
                zIndex: 10,
              }}
            >
              Remove
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
