import React, { useState } from 'react';
import './index.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsLoading(true);
    setError('');
    
    try {
      const newMessage = { content: inputText, isBot: false };
      setMessages(prev => [...prev, newMessage]);
      
      const response = await fetch(process.env.REACT_APP_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are a helpful assistant. Respond conversationally' },
            { role: 'user', content: inputText }
          ]
        })
      });

      if (!response.ok) throw new Error('API request failed');
      
      const data = await response.json();
      console.log('API Response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }
      
      const botMessage = data.choices?.[0]?.message?.content
        ?.replace(/\\(?:boxed|text){([^}]*)}/g, '$1')
        ?.replace(/\\\\(?:\(|\))/g, '')
        ?.replace(/\$/g, '') || 'No response content';
      
      setMessages(prev => [...prev, { content: botMessage, isBot: true }]);
      setInputText('');
    } catch (err) {
      setError(err.message || 'Failed to get response');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="chat-window">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.isBot ? 'bot' : 'user'}`}>
            {msg.content}
          </div>
        ))}
        {isLoading && <div className="loading">Processing...</div>}
        {error && <div className="error">{error}</div>}
      </div>
      
      <form onSubmit={handleSubmit}>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

export default App;