import { useEffect, useRef, useState } from 'react';

export default function ChatWindow({
  currentUserId,
  selectedUser,
  messages,
  messageText,
  onMessageChange,
  onSend,
  onDeleteConversation,
  onHideUser,
  selectedMessages,
  onToggleSelectMessage,
  onDeleteMessagesForMe,
  onDeleteMessagesForEveryone,
  onClearSelection,
  loading,
  connected,
  socket,
  typingUsers,
  replyingTo,
  onSetReplyingTo,
  onTyping,
  onAddReaction,
}) {
  const endRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const typingTimeoutRef = useRef(null);

  const emojis = ['😊', '❤️', '😂', '🔥', '👍', '😢', '😡', '🎉'];

  const getReplyContent = (messageId) => {
    return messages.find((m) => m.id === messageId);
  };

  const handleTextChange = (text) => {
    onMessageChange(text);
    onTyping?.();
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit('stop_typing', { to: selectedUser?.id });
    }, 1000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

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
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {selectedMessages.length === 0 ? (
            <>
              <button
                className="btn ghost"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
                onClick={onDeleteConversation}
                title="Clear messages for both"
              >
                Clear Chat
              </button>
              <button
                className="btn ghost"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
                onClick={onHideUser}
                title="Remove from your chat list"
              >
                Hide User
              </button>
            </>
          ) : (
            <>
              <span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
                {selectedMessages.length} selected
              </span>
              <button
                className="btn ghost"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
                onClick={onDeleteMessagesForMe}
              >
                Delete for Me
              </button>
              <button
                className="btn ghost"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
                onClick={onDeleteMessagesForEveryone}
              >
                Delete for Everyone
              </button>
              <button
                className="btn ghost"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
                onClick={onClearSelection}
              >
                Cancel
              </button>
            </>
          )}
          <div className={`pill ${connected ? 'pill-online' : 'pill-offline'}`}>
            {connected ? 'Connected' : 'Connecting...'}
          </div>
        </div>
      </header>

      <div className="messages">
        {loading && <div className="muted">Loading messages...</div>}
        {messages.map((msg) => {
          const mine = msg.sender === currentUserId;
          const isSelected = selectedMessages.includes(msg.id);
          const replyMsg = msg.replyTo ? getReplyContent(msg.replyTo) : null;
          return (
            <div key={msg.id || `${msg.createdAt}-${msg.content}`}>
              {replyMsg && (
                <div className={`message-reply ${mine ? 'mine' : 'theirs'}`}>
                  <div className="reply-reference">
                    Replying to: {replyMsg.content.substring(0, 40)}
                    {replyMsg.content.length > 40 ? '...' : ''}
                  </div>
                </div>
              )}
              <div
                className={`message ${mine ? 'mine' : 'theirs'} ${isSelected ? 'selected' : ''}`}
                onClick={() => onToggleSelectMessage(msg.id)}
                style={{ cursor: 'pointer', opacity: isSelected ? 0.7 : 1, position: 'relative' }}
              >
                <div className="bubble-wrapper">
                  <div className="bubble">
                    {isSelected && <span style={{ marginRight: '0.5rem' }}>✓</span>}
                    {msg.content}
                  </div>
                  <div className="message-actions">
                    <button
                      className="emoji-btn"
                      onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)}
                      title="Add reaction"
                    >
                      😊
                    </button>
                    <button
                      className="reply-btn"
                      onClick={() => onSetReplyingTo(msg.id)}
                      title="Reply to message"
                    >
                      ↩️
                    </button>
                  </div>
                </div>

                {showEmojiPicker === msg.id && (
                  <div className="emoji-picker">
                    {emojis.map((emoji) => (
                      <button
                        key={emoji}
                        className="emoji-option"
                        onClick={() => {
                          onAddReaction(msg.id, emoji);
                          setShowEmojiPicker(null);
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {msg.reactions && msg.reactions.length > 0 && (
                  <div className="reactions">
                    {msg.reactions.map((r, idx) => (
                      <span key={idx} className="reaction" title={`Reacted by ${r.userId}`}>
                        {r.emoji}
                      </span>
                    ))}
                  </div>
                )}

                <div className="timestamp">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {msg.seenBy && msg.seenBy.includes(selectedUser?.id) && mine && (
                    <span style={{ marginLeft: '0.3rem' }}>✓✓</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {typingUsers[selectedUser?.id] && (
          <div className="typing-indicator">
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          onSend();
        }}
      >
        {replyingTo && (
          <div className="reply-preview">
            <div className="reply-info">
              Replying to: {getReplyContent(replyingTo)?.content.substring(0, 50)}...
            </div>
            <button
              type="button"
              className="reply-close"
              onClick={() => onSetReplyingTo(null)}
            >
              ×
            </button>
          </div>
        )}
        <div className="composer-inner">
          <textarea
            placeholder={connected ? 'Type a message... (Enter to send, Shift+Enter for new line)' : 'Waiting for socket...'}
            value={messageText}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!selectedUser || !connected}
            style={{
              minHeight: '2.5rem',
              maxHeight: '8rem',
              resize: 'none',
              overflow: 'auto',
            }}
          />
          <button className="btn primary" type="submit" disabled={!messageText.trim() || !connected}>
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
