document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendButton');
    const typingIndicator = document.getElementById('typingIndicator');
    const errorMessage = document.getElementById('errorMessage');

    // Auto-resize the textarea
    chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
    });

    // Handle sending a message
    const sendMessage = async () => {
        const message = chatInput.value.trim();
        if (!message) return;

        addMessage('user', message);
        chatInput.value = '';
        chatInput.style.height = 'auto';

        const welcomeContainer = document.querySelector('.welcome-message-container');
        if (welcomeContainer) {
            welcomeContainer.remove();
        }

        showTyping();
        
        const formData = new FormData();
        formData.append('query', message);

        try {
            const response = await fetch('chat.php', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            hideTyping();
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
                const textResponse = data.candidates[0].content.parts[0].text;
                addMessage('ai', textResponse);
            } else if (data.error) {
                 showError(data.error);
            } else {
                 showError('No valid response from the Gemini API.');
            }
        } catch (error) {
            hideTyping();
            showError('An error occurred while fetching the response.');
            console.error('Fetch error:', error);
        }
    };

    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Helper functions for UI
    const addMessage = (sender, content) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;

        const avatar = document.createElement('div');
        avatar.className = `message-avatar ${sender}-avatar`;
        avatar.textContent = sender === 'user' ? 'U' : 'TG';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>');

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
    };

    const showTyping = () => {
        typingIndicator.style.display = 'flex';
        sendButton.disabled = true;
        scrollToBottom();
    };

    const hideTyping = () => {
        typingIndicator.style.display = 'none';
        sendButton.disabled = false;
    };

    const showError = (message) => {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 100);
    };
});