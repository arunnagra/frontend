import React, { useEffect, useRef, useState } from "react";
import "../styles/chat.css";

const RoomChat = ({
  roomId,
  username,
  chat = [],
  onSendMessage,
  onTyping,
  onStopTyping,
  typingUsers = [],
}) => {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const otherTyping = typingUsers.filter((name) => name && name !== username);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  useEffect(() => {
    return () => {
      if (isTyping) {
        onStopTyping?.();
      }
    };
  }, [isTyping, onStopTyping]);

  const handleChange = (event) => {
    const nextValue = event.target.value;
    setMessage(nextValue);
    if (!isTyping) {
      setIsTyping(true);
      onTyping?.();
    }
  };

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    onSendMessage(trimmed);
    setMessage("");
    if (isTyping) {
      setIsTyping(false);
      onStopTyping?.();
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="room-chat-shell">
      <div className="room-chat-header">
        <div>
          <div className="room-chat-title">Room Chat</div>
          <div className="room-chat-subtitle">Keep the game rolling with live chat</div>
        </div>
        <div className="room-chat-meta">Room {roomId}</div>
      </div>

      <div className="room-chat-window">
        {chat.length === 0 ? (
          <div className="room-chat-empty">No messages yet. Say hello!</div>
        ) : (
          chat.map((messageItem) => {
            const isSystem = messageItem.type === "system";
            const isOwn = !isSystem && messageItem.sender === username;
            const bubbleClass = [
              "room-chat-bubble",
              isSystem && "system-bubble",
              isOwn && "own-bubble",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <div
                key={messageItem.id ?? `${messageItem.sender}-${messageItem.timestamp}`}
                className={bubbleClass}
              >
                <div className="room-chat-top">
                  <span className="room-chat-sender">
                    {isSystem ? "SYSTEM" : messageItem.sender}
                  </span>
                  <span className="room-chat-time">
                    {new Date(messageItem.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="room-chat-text">{messageItem.text}</div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="room-chat-footer">
        <textarea
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="room-chat-input"
          rows={2}
        />
        <button className="room-chat-send-btn" onClick={handleSend}>
          Send
        </button>
      </div>

      {otherTyping.length > 0 && (
        <div className="room-chat-typing-indicator">
          {otherTyping.join(", ")} {otherTyping.length === 1 ? "is" : "are"} typing...
        </div>
      )}
    </div>
  );
};

export default RoomChat;
