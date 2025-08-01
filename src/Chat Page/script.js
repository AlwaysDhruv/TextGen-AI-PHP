document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chatContainer');
    const initialPromptContainer = document.getElementById('initialPromptContainer');
    const greetingMessage = document.getElementById('greetingMessage');
    const initialMessageInput = document.getElementById('initialMessageInput');
    const initialSendButton = document.getElementById('initialSendButton');
    const modelLoadingStatus = document.getElementById('modelLoadingStatus');

    const chatBox = document.getElementById('chatBox');
    const standardChatInput = document.getElementById('standardChatInput');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const modelSelect = document.getElementById('modelSelect');

    let isFirstMessageSent = false;
    window.userInitial = 'U'; // Default user avatar

    // Fetch user initial from server
    fetch('get_initial.php')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                window.userInitial = data.initial;
            }
        })
        .catch(err => console.warn('Failed to fetch user initial:', err));

    function getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning!';
        if (hour < 18) return 'Good Afternoon!';
        return 'Good Evening!';
    }
    function typeTextAnimation(text, container, speed = 30) {
        let index = 0;
        function typeNext() {
            if (index < text.length) {
                container.textContent += text.charAt(index);
                index++;
                setTimeout(typeNext, speed);
            }
        }
        typeNext();
    }

    function addMessage(messageText, sender) {
        const messageDiv = document.createElement("div");
        messageDiv.className = `message ${sender}-message`;

        const avatarDiv = document.createElement("div");
        avatarDiv.className = "avatar";
        avatarDiv.textContent = sender === "user" ? userInitial : "🤖";

        const textDiv = document.createElement("div");
        textDiv.className = "message-text";

        if (sender === "bot") {
            typeTextAnimation(messageText, textDiv); // 🔄 use animation for bot
        } else {
            textDiv.textContent = messageText;
        }

        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(textDiv);

        const chatBox = document.getElementById("chatBox");
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    async function sendMessageToOllama(message, model) {
        if (!message) return;

        if (!model || ['loading', 'no-models', 'error'].includes(model)) {
            addMessage('ollama', 'Please select a valid Ollama model first.');
            return;
        }

        const typingMessageElement = document.createElement('div');
        typingMessageElement.classList.add('message', 'ollama-message');
        typingMessageElement.id = 'ollama-typing-indicator';

        const avatar = document.createElement('div');
        avatar.classList.add('avatar');
        avatar.textContent = 'O';

        const text = document.createElement('div');
        text.classList.add('message-text');
        text.textContent = 'Ollama is thinking...';

        typingMessageElement.appendChild(avatar);
        typingMessageElement.appendChild(text);
        chatBox.appendChild(typingMessageElement);
        chatBox.scrollTop = chatBox.scrollHeight;

        try {
            const response = await fetch('chat.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, model })
            });
            const data = await response.json();

            document.getElementById('ollama-typing-indicator')?.remove();

            if (data.success) {
                addMessage('ollama', data.response);
            } else {
                addMessage('ollama', 'Error: ' + data.error);
            }
        } catch (error) {
            document.getElementById('ollama-typing-indicator')?.remove();
            addMessage('ollama', 'Network error sending message: ' + error.message);
        } finally {
            messageInput.disabled = false;
            sendButton.disabled = false;
            initialMessageInput.disabled = false;
            initialSendButton.disabled = false;
            messageInput.focus();
        }
    }

    function activateChatLayout() {
        if (isFirstMessageSent) return;
        isFirstMessageSent = true;
        chatContainer.classList.add('chat-active');

        initialPromptContainer.style.opacity = '0';
        initialPromptContainer.style.transform = 'translateY(-50px)';
        setTimeout(() => {
            initialPromptContainer.style.display = 'none';
        }, 500);

        chatBox.style.display = 'flex';
        standardChatInput.style.display = 'flex';
        setTimeout(() => {
            chatBox.style.opacity = '1';
            standardChatInput.style.opacity = '1';
        }, 300);

        messageInput.focus();
    }

    greetingMessage.textContent = getGreeting();

    async function loadOllamaModels() {
        try {
            const response = await fetch('chat.php?action=get_models');
            const data = await response.json();

            modelSelect.innerHTML = '';
            if (data.success && data.models.length > 0) {
                data.models.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model;
                    option.textContent = model;
                    modelSelect.appendChild(option);
                });

                modelSelect.value = data.models[0];
                initialSendButton.disabled = false;
                initialMessageInput.disabled = false;
                sendButton.disabled = false;
                messageInput.disabled = false;
                modelLoadingStatus.textContent = "Models loaded. Start chatting!";
                modelLoadingStatus.style.color = 'green';
                initialMessageInput.focus();
            } else {
                const option = document.createElement('option');
                option.value = "no-models";
                option.textContent = "No models found. Run 'ollama pull <model_name>'";
                option.disabled = true;
                option.selected = true;
                modelSelect.appendChild(option);
                initialSendButton.disabled = true;
                initialMessageInput.disabled = true;
                sendButton.disabled = true;
                messageInput.disabled = true;
                modelLoadingStatus.textContent = "No Ollama models found.";
                modelLoadingStatus.style.color = 'red';
            }
        } catch (error) {
            const option = document.createElement('option');
            option.value = "network-error";
            option.textContent = "Network error loading models!";
            option.disabled = true;
            option.selected = true;
            modelSelect.appendChild(option);
            initialSendButton.disabled = true;
            initialMessageInput.disabled = true;
            sendButton.disabled = true;
            messageInput.disabled = true;
            modelLoadingStatus.textContent = "Check server connection.";
            modelLoadingStatus.style.color = 'red';
        }
    }

    loadOllamaModels();

    initialSendButton.addEventListener('click', async () => {
        const message = initialMessageInput.value.trim();
        const selectedModel = modelSelect.value;
        if (!message) return;

        activateChatLayout();
        addMessage('user', message);
        initialMessageInput.value = '';
        initialSendButton.disabled = true;
        initialMessageInput.disabled = true;
        sendButton.disabled = true;
        messageInput.disabled = true;

        await sendMessageToOllama(message, selectedModel);
    });

    initialMessageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') initialSendButton.click();
    });

    sendButton.addEventListener('click', async () => {
        const message = messageInput.value.trim();
        const selectedModel = modelSelect.value;
        if (!message) return;

        addMessage('user', message);
        messageInput.value = '';
        sendButton.disabled = true;
        messageInput.disabled = true;

        await sendMessageToOllama(message, selectedModel);
    });

    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendButton.click();
    });
});