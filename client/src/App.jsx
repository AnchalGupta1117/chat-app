import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import AuthForm from './components/AuthForm';
import UserList from './components/UserList';
import ChatWindow from './components/ChatWindow';
import { api, API_URL, setAuthToken } from './api';
import './styles.css';

const storedToken = localStorage.getItem('chatToken') || '';
const storedUser = localStorage.getItem('chatUser');
const parsedUser = storedUser ? JSON.parse(storedUser) : null;

function App() {
  const [mode, setMode] = useState('login');
  const [token, setToken] = useState(storedToken);
  const [currentUser, setCurrentUser] = useState(parsedUser);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const [onlineIds, setOnlineIds] = useState([]);

  const socketRef = useRef(null);
  const selectedIdRef = useRef(null);

  useEffect(() => {
    if (token) {
      setAuthToken(token);
      localStorage.setItem('chatToken', token);
    } else {
      setAuthToken(null);
      localStorage.removeItem('chatToken');
    }
  }, [token]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('chatUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('chatUser');
    }
  }, [currentUser]);

  useEffect(() => {
    if (!token) {
      setUsers([]);
      setMessages([]);
      setSelectedUser(null);
      setOnlineIds([]);
      socketRef.current?.disconnect();
      return undefined;
    }

    const socket = io(API_URL, {
      auth: { token },
    });

    socketRef.current = socket;

    socket.on('connect', () => setSocketConnected(true));
    socket.on('disconnect', () => setSocketConnected(false));
    socket.on('online_users', (ids) => setOnlineIds(ids));
    socket.on('user_online', ({ userId }) => {
      setOnlineIds((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
    });
    socket.on('user_offline', ({ userId }) => {
      setOnlineIds((prev) => prev.filter((id) => id !== userId));
    });
    socket.on('connect_error', (err) => {
      setError(err?.message || 'Socket connection failed');
    });
    socket.on('private_message', (msg) => {
      const isRelevant = msg.sender === selectedIdRef.current || msg.recipient === selectedIdRef.current;
      if (isRelevant) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  useEffect(() => {
    selectedIdRef.current = selectedUser?.id || null;
    if (!selectedUser || !token) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const { data } = await api.get(`/api/messages/${selectedUser.id}`);
        setMessages(data);
      } catch (err) {
        console.error(err);
        setError('Unable to load messages');
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [selectedUser, token]);

  useEffect(() => {
    if (!token) return;
    const loadUsers = async () => {
      setLoadingUsers(true);
      try {
        const { data } = await api.get('/api/users');
        const merged = data.map((u) => ({ ...u, online: onlineIds.includes(u.id) }));
        setUsers(merged);
        if (selectedUser) {
          const updatedSelected = merged.find((u) => u.id === selectedUser.id);
          setSelectedUser(updatedSelected || null);
        }
      } catch (err) {
        console.error(err);
        setError('Unable to load users');
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
  }, [token, onlineIds]);

  const handleAuth = async (payload) => {
    setLoadingAuth(true);
    setError('');
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const { data } = await api.post(endpoint, payload);
      setToken(data.token);
      setCurrentUser(data.user);
    } catch (err) {
      const message = err.response?.data?.message || 'Authentication failed';
      setError(message);
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    setCurrentUser(null);
    setUsers([]);
    setMessages([]);
    setSelectedUser(null);
    setOnlineIds([]);
    socketRef.current?.disconnect();
  };

  const sendMessage = () => {
    if (!messageText.trim() || !selectedUser) return;
    const payload = { to: selectedUser.id, content: messageText.trim() };
    setMessageText('');

    socketRef.current?.emit('private_message', payload, (resp) => {
      if (resp?.ok && resp.message) {
        setMessages((prev) => [...prev, resp.message]);
      } else if (resp?.message) {
        setError(resp.message);
      }
    });
  };

  const handleDeleteConversation = async () => {
    if (!selectedUser) return;
    if (!window.confirm(`Delete entire conversation with ${selectedUser.name}? This cannot be undone.`)) return;

    try {
      await api.delete(`/api/messages/conversation/${selectedUser.id}`);
      setMessages([]);
      setError('');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to delete conversation';
      setError(message);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Delete your account permanently? All your messages will be deleted. This cannot be undone.')) return;

    try {
      await api.delete('/api/users/me');
      handleLogout();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to delete account';
      setError(message);
    }
  };

  if (!token || !currentUser) {
    return (
      <div className="auth-card card">
        {error && <div className="muted" style={{ marginBottom: '0.5rem', color: '#fca5a5' }}>{error}</div>}
        <AuthForm
          mode={mode}
          onSubmit={handleAuth}
          loading={loadingAuth}
          onSwitchMode={() => setMode(mode === 'login' ? 'register' : 'login')}
        />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="card" style={{ padding: 0 }}>
        <div className="topbar">
          <div>
            <div className="brand">Realtime Chat</div>
            <div className="muted">Logged in as {currentUser.name}</div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn ghost" onClick={handleDeleteAccount} title="Delete account">Delete Account</button>
            <button className="btn ghost" onClick={handleLogout}>Logout</button>
          </div>
        </div>
        {loadingUsers && <div className="muted" style={{ padding: '0 1rem' }}>Refreshing users...</div>}
        <UserList users={users} selectedId={selectedUser?.id} onSelect={setSelectedUser} />
      </div>

      <div className="card" style={{ padding: 0 }}>
        <ChatWindow
          currentUserId={currentUser.id}
          selectedUser={selectedUser}
          messages={messages}
          messageText={messageText}
          onMessageChange={setMessageText}
          onSend={sendMessage}
          onDeleteConversation={handleDeleteConversation}
          loading={loadingMessages}
          connected={socketConnected}
        />
        {error && <div style={{ padding: '0.75rem 1rem', color: '#fca5a5' }}>{error}</div>}
      </div>
    </div>
  );
}

export default App;
