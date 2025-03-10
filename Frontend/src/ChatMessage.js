import React from 'react';

const ChatMessage = ({ msg }) => {
  const parts = msg.content.split(/(\*\*.*?\*\*)/g);
  
  return (
    <div className={`message ${msg.isBot ? 'bot' : 'user'}`}>
      {parts.map((part, index) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={index}>{part.slice(2, -2)}</strong>
        ) : (
          part
        )
      )}
    </div>
  );
};

export default React.memo(ChatMessage);