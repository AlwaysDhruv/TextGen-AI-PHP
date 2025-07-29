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

    let isFirstMessageSent = false; // Flag to track the first message

    // --- Utility Functions ---

    // Function to get time-based greeting
    function getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) {
            return 'Good Morning!';
        } else if (hour < 18) {
            return 'Good Afternoon!';
        } else {
            return 'Good Evening!';
        }
    }

    // Function to add a message to the chat box
    function addMessage(sender, message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.classList.add(sender === 'user' ? 'user-message' : 'ollama-message');
        messageElement.textContent = message;
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight; // Scroll to the bottom of the chat
    }

    // Function to handle sending a message to Ollama
    async function sendMessageToOllama(message, model) {
        if (message === '') {
            return;
        }

        if (model === 'loading' || model === 'no-models' || model === 'error' || !model) {
            addMessage('ollama', 'Please select a valid Ollama model first.');
            return;
        }

        // Add a temporary "typing" message from Ollama
        const typingMessageElement = document.createElement('div');
        typingMessageElement.classList.add('message', 'ollama-message');
        typingMessageElement.textContent = 'Ollama is thinking...';
        typingMessageElement.id = 'ollama-typing-indicator';
        chatBox.appendChild(typingMessageElement);
        chatBox.scrollTop = chatBox.scrollHeight;

        try {
            const response = await fetch('chat.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    model: model
                })
            });
            const data = await response.json();

            // Remove the typing indicator
            if (document.getElementById('ollama-typing-indicator')) {
                document.getElementById('ollama-typing-indicator').remove();
            }

            if (data.success) {
                addMessage('ollama', data.response);
            } else {
                addMessage('ollama', 'Error: ' + data.error);
            }
        } catch (error) {
            // Remove the typing indicator on network error
            if (document.getElementById('ollama-typing-indicator')) {
                document.getElementById('ollama-typing-indicator').remove();
            }
            addMessage('ollama', 'Network error sending message: ' + error.message);
        } finally {
            // Re-enable input and button for the active input field
            messageInput.disabled = false;
            sendButton.disabled = false;
            initialMessageInput.disabled = false; // Ensure initial input is also re-enabled if still active
            initialSendButton.disabled = false;
            messageInput.focus(); // Focus the standard input
        }
    }

    // --- Layout Management ---

    // Function to activate the full chat layout
    function activateChatLayout() {
        if (isFirstMessageSent) return; // Only run once

        isFirstMessageSent = true;
        chatContainer.classList.add('chat-active');

        // Hide initial prompt container with a slight delay for transition
        initialPromptContainer.style.opacity = '0';
        initialPromptContainer.style.transform = 'translateY(-50px)';
        setTimeout(() => {
            initialPromptContainer.style.display = 'none';
        }, 500); // Match CSS transition duration

        // Show chat box and standard input
        chatBox.style.display = 'flex';
        standardChatInput.style.display = 'flex';
        // Fade in after a short delay
        setTimeout(() => {
            chatBox.style.opacity = '1';
            standardChatInput.style.opacity = '1';
        }, 300); // Start fade-in slightly before initial container hides

        messageInput.focus(); // Focus the standard chat input
    }

    // --- Initial Setup ---

    // Display the initial greeting
    greetingMessage.textContent = getGreeting();

    // Load Ollama models
    async function loadOllamaModels() {
        try {
            const response = await fetch('chat.php?action=get_models');
            const data = await response.json();

            if (data.success) {
                modelSelect.innerHTML = '';
                if (data.models.length === 0) {
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
                    modelLoadingStatus.textContent = "No Ollama models found. Please download some.";
                    modelLoadingStatus.style.color = 'red';
                } else {
                    data.models.forEach(model => {
                        const option = document.createElement('option');
                        option.value = model;
                        option.textContent = model;
                        modelSelect.appendChild(option);
                    });
                    modelSelect.value = data.models[0]; // Select the first model by default
                    initialSendButton.disabled = false;
                    initialMessageInput.disabled = false;
                    sendButton.disabled = false;
                    messageInput.disabled = false;
                    modelLoadingStatus.textContent = "Models loaded. Start chatting!";
                    modelLoadingStatus.style.color = 'green';
                    initialMessageInput.focus(); // Focus initial input once models are ready
                }
            } else {
                addMessage('ollama', 'Error loading models: ' + data.error);
                const option = document.createElement('option');
                option.value = "error";
                option.textContent = "Error loading models!";
                option.disabled = true;
                option.selected = true;
                modelSelect.appendChild(option);
                initialSendButton.disabled = true;
                initialMessageInput.disabled = true;
                sendButton.disabled = true;
                messageInput.disabled = true;
                modelLoadingStatus.textContent = "Error loading models: " + data.error;
                modelLoadingStatus.style.color = 'red';
            }
        } catch (error) {
            addMessage('ollama', 'Network error loading models. Is PHP server running and accessible? ' + error.message);
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
            modelLoadingStatus.textContent = "Network error loading models. Check server.";
            modelLoadingStatus.style.color = 'red';
        }
    }

    // Initial load of models
    loadOllamaModels();

    // --- Event Listeners ---

    // Event listener for the initial Send button
    initialSendButton.addEventListener('click', async () => {
        const message = initialMessageInput.value.trim();
        const selectedModel = modelSelect.value;

        if (message === '') {
            return;
        }

        activateChatLayout(); // Trigger layout change
        addMessage('user', message); // Add user message to chat history
        initialMessageInput.value = ''; // Clear initial input

        initialSendButton.disabled = true; // Disable while processing
        initialMessageInput.disabled = true;
        sendButton.disabled = true; // Also disable standard input
        messageInput.disabled = true;

        await sendMessageToOllama(message, selectedModel);
    });

    // Allow sending message with Enter key from initial input
    initialMessageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            initialSendButton.click();
        }
    });

    // Event listener for the standard Send button
    sendButton.addEventListener('click', async () => {
        const message = messageInput.value.trim();
        const selectedModel = modelSelect.value;

        if (message === '') {
            return;
        }

        addMessage('user', message);
        messageInput.value = ''; // Clear standard input

        sendButton.disabled = true; // Disable while processing
        messageInput.disabled = true;

        await sendMessageToOllama(message, selectedModel);
    });

    // Allow sending message with Enter key from standard input
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendButton.click();
        }
    });
});