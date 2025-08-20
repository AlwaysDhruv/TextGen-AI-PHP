class EnhancedGeminiChat {
    constructor() {
        this.history = [];
        this.isGenerating = false;
        this.abortController = null;
        this.isStopped = false;
        this.initializeElements();
        this.attachEventListeners();
        this.setupInitialGreeting();
    }
    // --- INITIALIZATION ---
    initializeElements() {
        this.chatMessages = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatInput');
        this.sendButton = document.getElementById('sendButton');
        this.stopButton = document.getElementById('stopButton');
        this.apiKeyInput = document.getElementById('apiKeyInput');
        this.apiStatus = document.getElementById('apiStatus');
        this.errorMessage = document.getElementById('errorMessage');
        this.welcomeContainer = document.querySelector('.welcome-message-container');
    }
    attachEventListeners() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.stopButton.addEventListener('click', () => this.stopGeneration());
        
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        this.chatInput.addEventListener('input', () => this.autoResizeTextarea());
        this.apiKeyInput.addEventListener('input', () => this.handleApiKeyInput());
        // Load saved API key
        const savedApiKey = localStorage.getItem('gemini_api_key');
        if (savedApiKey) {
            this.apiKeyInput.value = savedApiKey;
            this.handleApiKeyInput();
        }
    }
    setupInitialGreeting() {
        const hour = new Date().getHours();
        let greeting;
        if (hour < 12) {
            greeting = "Good morning! ☀️";
        } else if (hour < 18) {
            greeting = "Good afternoon! 🌤️";
        } else {
            greeting = "Good evening! 🌙";
        }
        
        // Update welcome title with dynamic greeting
        const welcomeTitle = document.querySelector('.welcome-title');
        if (welcomeTitle) {
            welcomeTitle.textContent = `${greeting} Ready to chat?`;
        }
    }
    
    handleApiKeyInput() {
        const hasApiKey = this.apiKeyInput.value.trim().length > 0;
        const apiKey = this.apiKeyInput.value.trim();
        
        // Save API key to localStorage
        if (hasApiKey) {
            localStorage.setItem('gemini_api_key', apiKey);
        } else {
            localStorage.removeItem('gemini_api_key');
        }
        
        this.chatInput.disabled = !hasApiKey;
        this.sendButton.disabled = !hasApiKey || !this.chatInput.value.trim();
        
        // Update API status indicator
        if (hasApiKey) {
            this.apiStatus.classList.add('connected');
            this.apiStatus.title = 'API Key Connected';
            this.hideError();
            this.chatInput.placeholder = "Ask me anything...";
        } else {
            this.apiStatus.classList.remove('connected');
            this.apiStatus.title = 'API Key Required';
            this.chatInput.placeholder = "Enter API key first...";
        }
    }
    // --- CORE CHAT LOGIC ---
    async sendMessage() {
        const prompt = this.chatInput.value.trim();
        const apiKey = this.apiKeyInput.value.trim();
        this.isStopped = false;
        if (!prompt || this.isGenerating) return;
        if (!apiKey) {
            this.showError("🔑 API key is required. Get one from Google AI Studio.");
            return;
        }
        // Remove welcome message on first interaction
        if (this.welcomeContainer) {
            this.welcomeContainer.style.animation = 'messageSlideOut 0.3s ease-in forwards';
            setTimeout(() => {
                this.welcomeContainer?.remove();
                this.welcomeContainer = null;
            }, 300);
        }
        
        this.addMessage('user', prompt);
        this.chatInput.value = '';
        this.autoResizeTextarea();
        this.setGeneratingState(true);
        // Create AI message with thinking animation
        const aiMessageContainer = this.createMessageElement('ai', '');
        const thinkingAnimation = this.createThinkingAnimation();
        aiMessageContainer.querySelector('.message-content').appendChild(thinkingAnimation);
        this.chatMessages.appendChild(aiMessageContainer);
        this.scrollToBottom();
        const contentDiv = aiMessageContainer.querySelector('.message-content');
        try {
            this.abortController = new AbortController();
            const signal = this.abortController.signal;
            const model = 'gemini-2.5-flash-preview-05-20';
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            
            this.history.push({ role: "user", parts: [{ text: prompt }] });
            const payload = {
                contents: this.history,
                safetySettings: [
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                ],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048,
                }
            };
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: signal
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error.message || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            thinkingAnimation.remove();
            if (data.candidates && data.candidates.length > 0) {
                const aiResponse = data.candidates[0].content.parts[0].text;
                if (!this.isStopped) {
                    await this.streamResponse(contentDiv, aiResponse);
                    this.history.push({ role: "model", parts: [{ text: aiResponse }] });
                }
            } else {
                const blockedMessage = "⚠️ The response was blocked due to safety settings. Please try rephrasing your question.";
                await this.streamResponse(contentDiv, blockedMessage);
                this.history.push({ role: "model", parts: [{ text: blockedMessage }] });
            }
        } catch (error) {
            thinkingAnimation.remove();
            if (error.name === 'AbortError') {
                await this.streamResponse(contentDiv, '🛑 Generation stopped.');
            } else {
                console.error('Error:', error);
                let errorMsg = '❌ Sorry, I encountered an error.';
                if (error.message.includes('API_KEY_INVALID')) {
                    errorMsg = '🔑 Invalid API key. Please check your API key.';
                    this.apiStatus.classList.remove('connected');
                } else if (error.message.includes('QUOTA_EXCEEDED')) {
                    errorMsg = '📊 API quota exceeded. Please check your usage.';
                }
                this.showError(errorMsg);
                await this.streamResponse(contentDiv, errorMsg);
            }
        } finally {
            this.setGeneratingState(false);
        }
    }
    
    stopGeneration() {
        if (this.abortController) {
            this.isStopped = true;
            this.abortController.abort();
        }
    }
    // --- UI AND MESSAGE HANDLING ---
    addMessage(sender, content) {
        const messageDiv = this.createMessageElement(sender, content);
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        return messageDiv;
    }
    createMessageElement(sender, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        const avatar = document.createElement('div');
        avatar.className = `message-avatar ${sender}-avatar`;
        avatar.textContent = sender === 'user' ? 'U' : 'T';
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = this.formatMessageContent(content);
        const time = document.createElement('div');
        time.className = 'message-time';
        time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        contentDiv.appendChild(time);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentDiv);
        
        if (sender === 'ai' && content) {
            const copyButton = this.createCopyButton(content);
            messageDiv.appendChild(copyButton);
        }
        return messageDiv;
    }
    createThinkingAnimation() {
        const animationDiv = document.createElement('div');
        animationDiv.className = 'thinking-animation';
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.className = 'thinking-dot';
            animationDiv.appendChild(dot);
        }
        return animationDiv;
    }
    async streamResponse(element, text) {
        element.innerHTML = '';
        let displayText = '';
        
        // Simulate streaming effect
        for (let i = 0; i < text.length; i++) {
            if (this.isStopped) break;
            
            displayText += text[i];
            element.innerHTML = this.formatMessageContent(displayText);
            this.scrollToBottom();
            
            // Variable delay for more natural feel
            const delay = text[i] === ' ' ? 30 : (text[i] === '\n' ? 50 : 15);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        // Ensure final formatting
        element.innerHTML = this.formatMessageContent(text);
        
        // Add copy button after streaming completes
        if (!this.isStopped) {
            const messageDiv = element.closest('.message');
            if (messageDiv && !messageDiv.querySelector('.copy-button')) {
                const copyButton = this.createCopyButton(text);
                messageDiv.appendChild(copyButton);
            }
        }
        
        this.scrollToBottom();
    }
    createCopyButton(text) {
        const button = document.createElement('button');
        button.className = 'copy-button';
        button.title = 'Copy to clipboard';
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
            </svg>
        `;
        button.addEventListener('click', () => this.copyToClipboard(text, button));
        return button;
    }
    formatMessageContent(content) {
        let htmlContent = content
            // Bold text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Italic text
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Inline code
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            // Code blocks
            .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
            // Links
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="api-link">$1</a>');
        
        // Convert line breaks
        htmlContent = htmlContent.replace(/\n/g, '<br>');
        
        return htmlContent;
    }
    
    setGeneratingState(isGenerating) {
        this.isGenerating = isGenerating;
        this.chatInput.disabled = isGenerating || !this.apiKeyInput.value.trim();
        this.sendButton.disabled = isGenerating || !this.apiKeyInput.value.trim() || !this.chatInput.value.trim();
        this.sendButton.style.display = isGenerating ? 'none' : 'flex';
        this.stopButton.style.display = isGenerating ? 'flex' : 'none';
        
        if (!isGenerating) {
            this.chatInput.focus();
            this.updateSendButtonState();
        }
    }
    updateSendButtonState() {
        const hasMessage = this.chatInput.value.trim().length > 0;
        const hasApiKey = this.apiKeyInput.value.trim().length > 0;
        this.sendButton.disabled = !hasMessage || !hasApiKey || this.isGenerating;
    }
    // --- UTILITY METHODS ---
    autoResizeTextarea() {
        this.chatInput.style.height = 'auto';
        this.chatInput.style.height = Math.min(this.chatInput.scrollHeight, 120) + 'px';
        this.updateSendButtonState();
    }
    showError(message) {
        this.errorMessage.innerHTML = message;
        this.errorMessage.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }
    hideError() {
        this.errorMessage.style.display = 'none';
    }
    
    async copyToClipboard(text, button) {
        try {
            // Remove HTML tags for clean text copy
            const cleanText = text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
            await navigator.clipboard.writeText(cleanText);
            
            button.classList.add('copied');
            button.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
            `;
            button.title = 'Copied!';
            
            setTimeout(() => {
                button.classList.remove('copied');
                button.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                    </svg>
                `;
                button.title = 'Copy to clipboard';
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
            button.title = 'Failed to copy!';
            
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text.replace(/<[^>]*>/g, '');
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                button.title = 'Copied!';
            } catch (fallbackErr) {
                button.title = 'Copy not supported';
            }
            document.body.removeChild(textArea);
        }
    }
    scrollToBottom() {
        requestAnimationFrame(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        });
    }
    // Clear chat history
    clearChat() {
        this.history = [];
        this.chatMessages.innerHTML = `
            <div class="welcome-message-container">
                <div class="welcome-title">Chat Cleared</div>
                <div class="welcome-subtitle">Ready for a new conversation!</div>
            </div>
        `;
        this.welcomeContainer = document.querySelector('.welcome-message-container');
    }
    // Export chat history
    exportChat() {
        const chatData = {
            timestamp: new Date().toISOString(),
            messages: this.history
        };
        
        const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `gemini-chat-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}
// Enhanced keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to send message
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const sendButton = document.getElementById('sendButton');
        if (!sendButton.disabled) {
            sendButton.click();
        }
    }
    
    // Escape to stop generation
    if (e.key === 'Escape') {
        const stopButton = document.getElementById('stopButton');
        if (stopButton.style.display === 'flex') {
            stopButton.click();
        }
    }
});
// Add CSS animation for welcome message fade out
const style = document.createElement('style');
style.textContent = `
    @keyframes messageSlideOut {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(-20px);
        }
    }
`;
document.head.appendChild(style);
// Initialize the enhanced chat when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.geminiChat = new EnhancedGeminiChat();
    
    // Add context menu for additional features
    document.addEventListener('contextmenu', (e) => {
        if (e.target.closest('.chat-messages')) {
            e.preventDefault();
            // Could add custom context menu here
        }
    });
    
    // Handle online/offline status
    window.addEventListener('online', () => {
        console.log('Connection restored');
    });
    
    window.addEventListener('offline', () => {
        window.geminiChat.showError('🌐 No internet connection detected');
    });
});