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
  const [showActions, setShowActions] = useState(null);
  const [actionMenuPos, setActionMenuPos] = useState({ top: '0px', left: '0px' });
  const [emojiPickerPos, setEmojiPickerPos] = useState({ top: '0px', left: '0px' });
  const typingTimeoutRef = useRef(null);
  const longPressTimer = useRef(null);
  const messagesRef = useRef(null);
  const actionTriggerRef = useRef({});

  const emojis = ['😊', '❤️', '😂', '🔥', '👍', '😢', '😡', '🎉'];

  const getReplyContent = (messageId) => {
    return messages.find((m) => m.id === messageId);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (messagesRef.current && !messagesRef.current.contains(e.target)) {
        return;
      }
      // Close menu if clicking outside the menu itself
      if (showActions) {
        const menuElement = document.querySelector('.message-actions-menu');
        const triggerElement = document.querySelector('.message-actions-trigger');
        if (menuElement && !menuElement.contains(e.target) && (!triggerElement || !triggerElement.contains(e.target))) {
          setShowActions(null);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showActions]);

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

  const handleMouseDown = (msgId) => {
    longPressTimer.current = setTimeout(() => {
      onToggleSelectMessage(msgId);
      longPressTimer.current = null;
    }, 500);
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchStart = (msgId) => {
    longPressTimer.current = setTimeout(() => {
      onToggleSelectMessage(msgId);
      longPressTimer.current = null;
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
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
        {selectedMessages.length === 0 ? (
          <>
            <div>
              <div className="user-name">{selectedUser.name}</div>
              <div className="chat-subtitle">{selectedUser.online ? 'Online' : 'Offline'}</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
              <div className={`pill ${connected ? 'pill-online' : 'pill-offline'}`}>
                {connected ? 'Connected' : 'Connecting...'}
              </div>
            </div>
          </>
        ) : (
          <div className="selection-toolbar">
            <span style={{ fontSize: '0.9rem', color: 'var(--muted)', flex: 1 }}>
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
          </div>
        )}
      </header>

      <div className="messages" ref={messagesRef}>
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
                onMouseDown={() => handleMouseDown(msg.id)}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={() => handleTouchStart(msg.id)}
                onTouchEnd={handleTouchEnd}
                style={{ 
                  cursor: 'pointer', 
                  opacity: isSelected ? 0.7 : 1, 
                  position: 'relative',
                  userSelect: 'none'
                }}
              >
                <div className="bubble-wrapper">
                  <div className="bubble">
                    {isSelected && <span style={{ marginRight: '0.5rem' }}>✓</span>}
                    <span style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                      {msg.content}
                    </span>
                  </div>
                  <div className="message-actions-trigger" ref={(el) => { if (el) actionTriggerRef.current[msg.id] = el; }} onClick={(e) => {
                    e.stopPropagation();
                    if (showActions === msg.id) {
                      setShowActions(null);
                    } else {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setActionMenuPos({ top: `${rect.bottom + 5}px`, left: `${rect.left}px` });
                      setShowActions(msg.id);
                    }
                  }}>
                    ⋯
                  </div>
                </div>

                {showActions === msg.id && (
                  <div className="message-actions-menu" style={actionMenuPos}>
                    <button
                      className="action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        setEmojiPickerPos({ top: `${rect.bottom + 5}px`, left: `${rect.left}px` });
                        setShowEmojiPicker(msg.id);
                        setShowActions(null);
                      }}
                    >
                      😊 React
                    </button>
                    <button
                      className="action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetReplyingTo(msg.id);
                        setShowActions(null);
                      }}
                    >
                      ↩️ Reply
                    </button>
                  </div>
                )}
style={emojiPickerPos} 
                {showEmojiPicker === msg.id && (
                  <div className="emoji-picker" onClick={(e) => e.stopPropagation()}>
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
                  {mine && (
                    <>
                      {msg.seenBy && msg.seenBy.length > 0 && msg.seenBy.some(id => id.toString() === selectedUser?.id.toString()) ? (
                        <span style={{ marginLeft: '0.3rem', color: '#38bdf8' }}>✓✓</span>
                      ) : (
                        <span style={{ marginLeft: '0.3rem', color: '#9ca3af' }}>✓</span>
                      )}
                    </>
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
