import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import AuthForm from './components/AuthForm';
import UserList from './components/UserList';
import ChatWindow from './components/ChatWindow';
import FriendRequests from './components/FriendRequests';
import AllUsers from './components/AllUsers';
import { api, API_URL, setAuthToken, getFriendsList } from './api';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [friendsList, setFriendsList] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('friends'); // 'friends' or 'explore'
  const [loadingFriends, setLoadingFriends] = useState(false);
  
  const socketRef = useRef(null);
  const selectedIdRef = useRef(null);
  const typingTimeoutRef = useRef({});

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
    socket.on('user_typing', ({ from }) => {
      setTypingUsers((prev) => ({ ...prev, [from]: true }));
      // Clear timeout if exists
      if (typingTimeoutRef.current[from]) {
        clearTimeout(typingTimeoutRef.current[from]);
      }
      // Auto-clear after 3 seconds
      typingTimeoutRef.current[from] = setTimeout(() => {
        setTypingUsers((prev) => {
          const updated = { ...prev };
          delete updated[from];
          return updated;
        });
      }, 3000);
    });
    socket.on('user_stop_typing', ({ from }) => {
      if (typingTimeoutRef.current[from]) {
        clearTimeout(typingTimeoutRef.current[from]);
      }
      setTypingUsers((prev) => {
        const updated = { ...prev };
        delete updated[from];
        return updated;
      });
    });
    socket.on('message_seen', ({ messageId, userId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, seenBy: [...new Set([...(msg.seenBy || []), userId])] }
            : msg
        )
      );
    });
    socket.on('reaction_updated', ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, reactions } : msg
        )
      );
    });
    socket.on('friend_request_received', (data) => {
      setFriendRequests((prev) => [...prev, data]);
    });
    socket.on('friend_request_accepted', (data) => {
      setFriendsList((prev) => [...prev, data.friend]);
    });
    socket.on('connect_error', (err) => {
      setError(err?.message || 'Socket connection failed');
    });
    socket.on('private_message', (msg) => {
      const isRelevant = msg.sender === selectedIdRef.current || msg.recipient === selectedIdRef.current;
      if (isRelevant) {
        setMessages((prev) => [...prev, msg]);
        // Mark as seen if we're viewing this chat
        if (msg.sender === selectedIdRef.current) {
          setTimeout(() => {
            socketRef.current?.emit('mark_as_seen', { messageId: msg.id });
          }, 500);
        }
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
    
    const loadFriends = async () => {
      try {
        setLoadingFriends(true);
        const res = await getFriendsList();
        setFriendsList(res.data || []);
      } catch (error) {
        console.error('Error loading friends:', error);
      } finally {
        setLoadingFriends(false);
      }
    };

    loadFriends();
  }, [token]);

  useEffect(() {
    if (!token) return;
    const loadUsers = async () => {
      setLoadingUsers(true);
      try {
        const { data } = await api.get('/api/users');
        const merged = data.map((u) => ({ ...u, online: onlineIds.includes(u.id) }));
        setAllUsers(merged);
        
        // Filter by hidden users and search query
        const hiddenUsers = JSON.parse(localStorage.getItem('hiddenUsers') || '[]');
        const filtered = merged.filter((u) => {
          const matchesSearch = !searchQuery || 
            u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase());
          const isHidden = hiddenUsers.includes(u.id);
          return matchesSearch && (searchQuery ? true : !isHidden);
        });
        
        setUsers(filtered);
        if (selectedUser) {
          const updatedSelected = filtered.find((u) => u.id === selectedUser.id);
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
  }, [token, onlineIds, searchQuery, selectedUser]);

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
    const payload = { to: selectedUser.id, content: messageText };
    if (replyingTo) {
      payload.replyTo = replyingTo;
    }
    setMessageText('');
    setReplyingTo(null);
    socketRef.current?.emit('stop_typing', { to: selectedUser.id });

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
    if (!window.confirm(`Clear entire conversation with ${selectedUser.name}? You both won't see each other until you search again.`)) return;

    try {
      await api.delete(`/api/messages/conversation/${selectedUser.id}`);
      setMessages([]);
      
      // Auto-hide user after clearing chat
      const hiddenUsers = JSON.parse(localStorage.getItem('hiddenUsers') || '[]');
      if (!hiddenUsers.includes(selectedUser.id)) {
        hiddenUsers.push(selectedUser.id);
        localStorage.setItem('hiddenUsers', JSON.stringify(hiddenUsers));
      }
      setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
      setSelectedUser(null);
      setError('');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to clear conversation';
      setError(message);
    }
  };

  const handleHideUser = () => {
    if (!selectedUser) return;
    if (!window.confirm(`Remove ${selectedUser.name} from your chat list? You can still receive messages if they contact you.`)) return;

    const hiddenUsers = JSON.parse(localStorage.getItem('hiddenUsers') || '[]');
    if (!hiddenUsers.includes(selectedUser.id)) {
      hiddenUsers.push(selectedUser.id);
      localStorage.setItem('hiddenUsers', JSON.stringify(hiddenUsers));
    }
    setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
    setSelectedUser(null);
    setMessages([]);
  };

  const handleDeleteMessagesForMe = async () => {
    if (selectedMessages.length === 0) return;
    if (!window.confirm(`Delete ${selectedMessages.length} message(s) for you only?`)) return;

    try {
      await Promise.all(
        selectedMessages.map((id) => api.delete(`/api/messages/${id}/for-me`))
      );
      setMessages((prev) => prev.filter((m) => !selectedMessages.includes(m.id)));
      setSelectedMessages([]);
      setError('');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to delete messages';
      setError(message);
    }
  };

  const handleDeleteMessagesForEveryone = async () => {
    if (selectedMessages.length === 0) return;
    const myMessages = messages.filter((m) => selectedMessages.includes(m.id) && m.sender === currentUser.id);
    if (myMessages.length === 0) {
      setError('You can only delete your own messages for everyone');
      return;
    }
    if (!window.confirm(`Delete ${myMessages.length} message(s) for everyone? This cannot be undone.`)) return;

    try {
      await Promise.all(
        myMessages.map((m) => api.delete(`/api/messages/${m.id}/for-everyone`))
      );
      setMessages((prev) => prev.filter((m) => !myMessages.map((msg) => msg.id).includes(m.id)));
      setSelectedMessages([]);
      setError('');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to delete messages';
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
          <button className="btn ghost" onClick={handleLogout}>Logout</button>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', padding: '0 1rem 0.5rem' }}>
          <button
            onClick={() => setActiveTab('friends')}
            style={{
              flex: 1,
              padding: '0.5rem 0.75rem',
              background: activeTab === 'friends' ? 'var(--primary)' : 'var(--panel-2)',
              color: activeTab === 'friends' ? '#0b1020' : 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.85rem',
              transition: 'all 150ms ease',
            }}
          >
            Friends {friendsList.length > 0 && `(${friendsList.length})`}
          </button>
          <button
            onClick={() => setActiveTab('explore')}
            style={{
              flex: 1,
              padding: '0.5rem 0.75rem',
              background: activeTab === 'explore' ? 'var(--primary)' : 'var(--panel-2)',
              color: activeTab === 'explore' ? '#0b1020' : 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.85rem',
              transition: 'all 150ms ease',
            }}
          >
            Explore
          </button>
        </div>

        {activeTab === 'friends' ? (
          <>
            <FriendRequests onRequestHandled={() => {}} />
            <div style={{ padding: '0.5rem 1rem' }}>
              <input
                type="text"
                placeholder="Search friends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: 'var(--panel-2)',
                  color: 'var(--text)',
                }}
              />
            </div>
            {loadingFriends && <div className="muted" style={{ padding: '0 1rem' }}>Loading friends...</div>}
            <UserList users={friendsList} selectedId={selectedUser?.id} onSelect={setSelectedUser} />
          </>
        ) : (
          <AllUsers currentUserId={currentUser.id} socket={socketRef.current} friendsList={friendsList} />
        )}
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
          onHideUser={handleHideUser}
          selectedMessages={selectedMessages}
          onToggleSelectMessage={(id) => {
            setSelectedMessages((prev) =>
              prev.includes(id) ? prev.filter((msgId) => msgId !== id) : [...prev, id]
            );
          }}
          onDeleteMessagesForMe={handleDeleteMessagesForMe}
          onDeleteMessagesForEveryone={handleDeleteMessagesForEveryone}
          onClearSelection={() => setSelectedMessages([])}
          loading={loadingMessages}
          connected={socketConnected}
          socket={socketRef.current}
          typingUsers={typingUsers}
          replyingTo={replyingTo}
          onSetReplyingTo={setReplyingTo}
          onTyping={() => {
            socketRef.current?.emit('typing', { to: selectedUser?.id });
          }}
          onAddReaction={(messageId, emoji) => {
            socketRef.current?.emit('add_reaction', { messageId, emoji });
          }}
        />
        {error && <div style={{ padding: '0.75rem 1rem', color: '#fca5a5' }}>{error}</div>}
      </div>
    </div>
  );
}

export default App;
