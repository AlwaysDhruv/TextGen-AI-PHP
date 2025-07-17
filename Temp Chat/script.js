let promptCount = 0;
const maxPrompts = 2;
let isTrialExpired = false;

function updatePromptCounter() {
    document.getElementById('promptCount').textContent = promptCount;
    if (promptCount >= maxPrompts) {
        isTrialExpired = true;
        document.getElementById('sendBtn').disabled = true;
        document.getElementById('messageInput').disabled = true;
        document.getElementById('messageInput').placeholder = "Trial expired. Please login to continue.";
        showTrialLimitMessage();
        setTimeout(() => {
            window.location.href = '../Login Page/Login.html';
        }, 3000);
    } else {
        const remaining = maxPrompts - promptCount;
        document.getElementById('messageInput').placeholder = `Type your message here... (Trial: ${remaining} prompts remaining)`;
    }
}

function showTrialLimitMessage() {
    const messagesContainer = document.getElementById('chatMessages');
    const limitMessage = document.createElement('div');
    limitMessage.className = 'trial-limit-message';
    limitMessage.innerHTML = `
        <h3>Trial Limit Reached</h3>
        <p>You've used all ${maxPrompts} free prompts. Login to continue using AI Assistant with unlimited access!</p>
        <a href="../Login Page/Login.html" class="login-btn">Login Now</a>
    `;
    messagesContainer.appendChild(limitMessage);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey && !isTrialExpired) {
        event.preventDefault();
        sendMessage();
    }
}

function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}

function sendMessage() {
    if (isTrialExpired) return;

    const input = document.getElementById('messageInput');
    const message = input.value.trim();

    if (message === '') return;

    promptCount++;
    updatePromptCounter();

    addMessage(message, 'user');
    input.value = '';
    input.style.height = 'auto';

    setTimeout(() => {
        const responses = [
            "I understand your question. Let me help you with that. This is a trial version - login for full access!",
            "That's an interesting point. Here's what I think... Remember, you have limited prompts in trial mode.",
            "Great question! I'd be happy to assist you with this. Login to continue unlimited conversations.",
            "I can definitely help you with that. Let me explain... This is your trial experience!",
            "Thanks for asking! Here's my response to your query. Consider logging in for more features."
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

// Initial update when the page loads
updatePromptCounter();