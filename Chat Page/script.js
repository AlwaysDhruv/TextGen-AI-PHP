let messages = [];

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

function toggleProfile() {
    alert('Profile menu would open here');
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = '../Welcome Page/Welcome.html';
    }
}

function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}

function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (message === '') return;
    
    addMessage(message, 'user');
    input.value = '';
    input.style.height = 'auto';
    
    setTimeout(() => {
        const responses = [
            "I understand your question. Let me help you with that.",
            "That's an interesting point. Here's what I think...",
            "Great question! I'd be happy to assist you with this.",
            "I can definitely help you with that. Let me explain...",
            "Thanks for asking! Here's my response to your query."
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        addMessage(randomResponse, 'ai');
    }, 1000);
}

function addMessage(text, sender) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    messageDiv.innerHTML = `
        <div class="message-avatar ${sender}">${sender === 'user' ? 'U' : 'AI'}</div>
        <div class="message-content">${text}</div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

document.querySelectorAll('.chat-item').forEach(item => {
    item.addEventListener('click', function() {
        document.querySelectorAll('.chat-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = `
            <div class="message">
                <div class="message-avatar ai">AI</div>
                <div class="message-content">
                    ${this.querySelector('.chat-item-preview').textContent}
                </div>
            </div>
        `;
        
        if (window.innerWidth <= 768) {
            toggleSidebar();
        }
    });
});

document.addEventListener('click', function(event) {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    
    if (window.innerWidth <= 768 && 
        sidebar.classList.contains('active') && 
        !sidebar.contains(event.target) && 
        !sidebarToggle.contains(event.target)) {
        toggleSidebar();
    }
});