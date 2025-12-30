import { useEffect, useRef } from 'react';

export default function ChatWindow({
  currentUserId,
  selectedUser,
  messages,
  messageText,
  onMessageChange,
  onSend,
  loading,
  connected,
}) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!selectedUser) {
    return (
      <div className="chat-window empty">
        <p>Select a user to start chatting.</p>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <header className="chat-header">
        <div>
          <div className="user-name">{selectedUser.name}</div>
          <div className="chat-subtitle">{selectedUser.online ? 'Online' : 'Offline'}</div>
        </div>
        <div className={`pill ${connected ? 'pill-online' : 'pill-offline'}`}>
          {connected ? 'Connected' : 'Connecting...'}
        </div>
      </header>

      <div className="messages">
        {loading && <div className="muted">Loading messages...</div>}
        {messages.map((msg) => {
          const mine = msg.sender === currentUserId;
          return (
            <div key={msg.id || `${msg.createdAt}-${msg.content}`}
              className={`message ${mine ? 'mine' : 'theirs'}`}>
              <div className="bubble">{msg.content}</div>
              <div className="timestamp">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          onSend();
        }}
      >
        <input
          type="text"
          placeholder={connected ? 'Type a message...' : 'Waiting for socket...'}
          value={messageText}
          onChange={(e) => onMessageChange(e.target.value)}
          disabled={!selectedUser || !connected}
        />
        <button className="btn primary" type="submit" disabled={!messageText.trim() || !connected}>
          Send
        </button>
      </form>
    </div>
  );
}
