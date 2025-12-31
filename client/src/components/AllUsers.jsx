import { useEffect, useState } from 'react';
import { api } from '../api';

export default function AllUsers({ currentUserId, socket, friendsList = [], friendRequests = [] }) {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sentRequests, setSentRequests] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadAllUsers();
  }, []);

  // Initialize sentRequests from friendRequests prop
  useEffect(() => {
    const pending = {};
    friendRequests.forEach((req) => {
      if (req.requester && req.requester._id) {
        pending[req.requester._id] = true;
      }
    });
    setSentRequests(pending);
  }, [friendRequests]);

  // Listen for real-time notifications
  useEffect(() => {
    if (!socket) return;

    const handleRequestSent = (data) => {
      console.log('Friend request sent event:', data);
      if (data.status === 'success') {
        setSentRequests((prev) => ({ ...prev, [data.recipientId]: true }));
        setError('');
      } else if (data.status === 'error') {
        setError(data.message || 'Failed to send request');
        setTimeout(() => setError(''), 3000);
      }
    };

    socket.on('friend_request_sent', handleRequestSent);

    return () => {
      socket.off('friend_request_sent', handleRequestSent);
    };
  }, [socket]);

  const loadAllUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/users');
      setAllUsers(res.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = (recipientId) => {
    if (!socket) {
      setError('Not connected to server');
      return;
    }
    console.log('Sending friend request to:', recipientId);
    // Optimistically update UI
    setSentRequests((prev) => ({ ...prev, [recipientId]: true }));
    socket.emit('send_friend_request', { recipientId });
  };

  const isFriend = (userId) => friendsList.some((f) => f._id === userId || f.id === userId);
  const isRequested = (userId) => sentRequests[userId];

  const filteredUsers = allUsers.filter(
    (user) =>
      user.id !== currentUserId &&
      user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: '1rem' }}>
      {error && (
        <div style={{ padding: '0.5rem', marginBottom: '1rem', background: '#fca5a5', color: '#0b1020', borderRadius: '6px', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '0.5rem 0.75rem',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--panel-2)',
            color: 'var(--text)',
            fontSize: '0.9rem',
          }}
        />
      </div>

      {loading ? (
        <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '1rem' }}>Loading users...</div>
      ) : filteredUsers.length === 0 ? (
        <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '1rem' }}>No users found</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filteredUsers.map((user) => (
            <div
              key={user._id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem',
                background: 'var(--panel-2)',
                borderRadius: '8px',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{user.name}</div>
              </div>

              {isFriend(user.id) ? (
                <button
                  disabled
                  style={{
                    padding: '0.4rem 0.8rem',
                    background: 'var(--primary)',
                    color: '#0b1020',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'default',
                  }}
                >
                  ✓ Friends
                </button>
              ) : isRequested(user.id) ? (
                <button
                  disabled
                  style={{
                    padding: '0.4rem 0.8rem',
                    background: 'var(--muted)',
                    color: 'var(--text)',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'default',
                    opacity: 0.6,
                  }}
                >
                  Pending...
                </button>
              ) : (
                <button
                  onClick={() => sendFriendRequest(user.id)}
                  style={{
                    padding: '0.4rem 0.8rem',
                    background: 'var(--primary)',
                    color: '#0b1020',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'transform 100ms ease',
                  }}
                  onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                  onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  + Add Friend
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
