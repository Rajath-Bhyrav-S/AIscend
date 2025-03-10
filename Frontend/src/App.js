import React, { useState, useEffect, useCallback, memo } from 'react';
import './index.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

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
        ?.replace(/\$/g, '')
        ?.replace(/^I/, '')
        ?.replace(/<\/｜>$/g, '') || 'No response content';
      
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
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        <svg width="24" height="24" viewBox="0 0 24 24">
          {theme === 'light' ? (
            <path fill="currentColor" d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0a.996.996 0 0 0 0-1.41l-1.06-1.06zm1.06-10.6a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>
          ) : (
            <path fill="currentColor" d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.65.6-1.47.97-2.39 1.01.73 2.12 2.7 3.68 5.03 3.71-1.65 2.92-5.07 4.88-9.07 4.64-4.33-.26-7.76-3.64-7.91-7.97C3.27 10.38 6.67 7 11 7c1.93 0 3.68.79 4.95 2.05C15.01 8.4 14.29 8 13.5 8c-1.93 0-3.5 1.57-3.5 3.5 0 .89.34 1.69.89 2.3-.46.07-.92.12-1.39.12z"/>
          )}
        </svg>
      </button>
      <div className="chat-window">
        {messages.map((msg, i) => {
          const parts = msg.content.split(/(\*\*.*?\*\*)/g);
          return (
            <div key={i} className={`message ${msg.isBot ? 'bot' : 'user'}`}>
              {parts.map((part, partIndex) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return <strong key={partIndex}>{part.slice(2, -2)}</strong>;
                }
                return part;
              })}
            </div>
          );
        })}
        {isLoading && <div className="loading">Processing...</div>}
        {error && <div className="error">{error}</div>}
      </div>
      
      <form onSubmit={handleSubmit}>
        <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
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