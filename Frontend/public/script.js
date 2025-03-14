// DOM Elements
const sidebar = document.getElementById('sidebar');
const menuButton = document.getElementById('menu-button');
const themeToggle = document.getElementById('theme-toggle');
const mobileThemeToggle = document.getElementById('mobile-theme-toggle');
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-button');
const messagesContainer = document.getElementById('messages');
const welcomeScreen = document.getElementById('welcome-screen');
const examplePrompts = document.querySelectorAll('.example-prompt');

// Mobile menu toggle
menuButton.addEventListener('click', () => {
    sidebar.classList.toggle('active');
});

// Theme toggle
function toggleTheme() {
    const isDarkMode = document.body.getAttribute('data-theme') === 'dark';
    
    if (isDarkMode) {
        document.body.removeAttribute('data-theme');
        themeToggle.innerHTML = '<span class="icon">🌙</span> Dark Mode';
        mobileThemeToggle.innerHTML = '<span class="icon">🌙</span>';
    } else {
        document.body.setAttribute('data-theme', 'dark');
        themeToggle.innerHTML = '<span class="icon">☀️</span> Light Mode';
        mobileThemeToggle.innerHTML = '<span class="icon">☀️</span>';
    }
}

themeToggle.addEventListener('click', toggleTheme);
mobileThemeToggle.addEventListener('click', toggleTheme);

// Auto-resize chat input
chatInput.addEventListener('input', () => {
    sendButton.disabled = chatInput.value.trim() === '';
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 200) + 'px';
});

// Handle send button click
sendButton.addEventListener('click', sendMessage);

// Handle enter key press
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Example prompts click
examplePrompts.forEach(prompt => {
    prompt.addEventListener('click', () => {
        const promptText = prompt.querySelector('p').textContent;
        chatInput.value = promptText;
        chatInput.dispatchEvent(new Event('input'));
        welcomeScreen.style.display = 'none';
        messagesContainer.style.display = 'block';
        addMessage(promptText, 'user');
        sendMessage();
    });
});

// Handle conversation clicks
const conversations = document.querySelectorAll('.conversation');
conversations.forEach(convo => {
    convo.addEventListener('click', () => {
        conversations.forEach(c => c.classList.remove('active'));
        convo.classList.add('active');
        welcomeScreen.style.display = 'none';
        messagesContainer.style.display = 'block';
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('active');
        }
    });
});

// New chat button
document.querySelector('.new-chat-btn').addEventListener('click', () => {
    messagesContainer.innerHTML = '';
    welcomeScreen.style.display = 'flex';
    messagesContainer.style.display = 'none';
    conversations.forEach(c => c.classList.remove('active'));
    localStorage.removeItem('sessionId');
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('active');
    }
});

// Send message to backend
async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    welcomeScreen.style.display = 'none';
    messagesContainer.style.display = 'block';
    addMessage(message, 'user');
    
    chatInput.value = '';
    chatInput.style.height = 'auto';
    sendButton.disabled = true;

    const typingIndicator = createTypingIndicator();
    messagesContainer.appendChild(typingIndicator);
    typingIndicator.scrollIntoView({ behavior: 'smooth' });

    try {
        const response = await fetch('http://localhost:5000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: localStorage.getItem('sessionId'),
                messages: [{
                    role: 'user',
                    content: message
                }]
            })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        messagesContainer.removeChild(typingIndicator);
        
        const aiMessage = data.choices[0].message.content;
        addMessage(aiMessage, 'ai');
        
        if (!localStorage.getItem('sessionId') && data.session_id) {
            localStorage.setItem('sessionId', data.session_id);
        }
    } catch (error) {
        messagesContainer.removeChild(typingIndicator);
        addMessage(`Error: ${error.message}`, 'ai');
        console.error('API request failed:', error);
    }
}

// Create typing indicator element
function createTypingIndicator() {
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'message ai-message';
    typingIndicator.innerHTML = `
        <div class="message-avatar ai-avatar">N</div>
        <div class="message-content">
            <div class="message-sender">RajathsAI</div>
            <div class="message-bubble">
                <div class="typing-indicator">
                    <span>●</span><span>●</span><span>●</span>
                </div>
            </div>
        </div>
    `;
    return typingIndicator;
}

// Add message to chat
function addMessage(text, sender) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}-message`;
    
    const senderName = sender === 'user' ? 'You' : 'RajathAI';
    const avatarLetter = sender === 'user' ? 'U' : 'N';
    
    messageElement.innerHTML = `
        <div class="message-avatar ${sender}-avatar">${avatarLetter}</div>
        <div class="message-content">
            <div class="message-sender">${senderName}</div>
            <div class="message-bubble">${text}</div>
            ${sender === 'ai' ? `
            <div class="message-actions">
                <button class="message-action">
                    <span class="icon">👍</span> Like
                </button>
                <button class="message-action">
                    <span class="icon">👎</span> Dislike
                </button>
                <button class="message-action">
                    <span class="icon">📋</span> Copy
                </button>
            </div>
            ` : ''}
        </div>
    `;
    
    messagesContainer.appendChild(messageElement);
    messageElement.scrollIntoView({ behavior: 'smooth' });
}

// Initialize message actions
document.addEventListener('click', function(e) {
    if (e.target.closest('.message-action')) {
        const action = e.target.closest('.message-action');
        if (action.textContent.includes('Copy')) {
            const messageBubble = action.closest('.message-content').querySelector('.message-bubble');
            navigator.clipboard.writeText(messageBubble.textContent.trim())
                .then(() => {
                    action.innerHTML = '<span class="icon">✓</span> Copied';
                    setTimeout(() => {
                        action.innerHTML = '<span class="icon">📋</span> Copy';
                    }, 2000);
                });
        }
    }
});