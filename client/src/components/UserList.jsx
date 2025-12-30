export default function UserList({ users, selectedId, onSelect }) {
  return (
    <div className="user-list">
      <div className="list-header">People</div>
      {users.length === 0 && <div className="empty">No other users yet.</div>}
      {users.map((user) => (
        <button
          key={user.id}
          className={`user-row ${selectedId === user.id ? 'selected' : ''}`}
          onClick={() => onSelect(user)}
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
      ))}
    </div>
  );
}
