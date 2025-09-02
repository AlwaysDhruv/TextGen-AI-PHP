class EnhancedGeminiChat {
    constructor() {
        this.history = [];
        this.allCodeBlocks = [];
        this.currentCodeBlockIndex = null; // ADDED: To track code for modal
        this.isGenerating = false;
        this.abortController = null;
        this.isStopped = false;
        this.initializeElements();
        this.attachEventListeners();
        this.setupInitialGreeting();
        this.createBackgroundParticles();
        this.loadApiKey();
    }

    loadApiKey() {
        const savedApiKey = localStorage.getItem('geminiApiKey');
        if (savedApiKey) {
            this.apiKeyInput.value = savedApiKey;
            this.handleApiKeyInput();
        }
    }

    handleApiKeyInput() {
        const apiKey = this.apiKeyInput.value.trim();
        localStorage.setItem('geminiApiKey', apiKey);

        const hasApiKey = apiKey.length > 0;
        this.chatInput.disabled = !hasApiKey;
        this.updateSendButtonState();

        this.apiStatus.classList.toggle('connected', hasApiKey);
        this.apiStatus.title = hasApiKey ? 'API Key Connected' : 'API Key Required';
        this.chatInput.placeholder = hasApiKey ? "Ask me anything..." : "Enter API key first...";
        if (hasApiKey) this.hideError();
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

        this.chatInput.addEventListener('input', () => {
            this.autoResizeTextarea();
            this.updateSendButtonState();
        });
        this.apiKeyInput.addEventListener('input', () => this.handleApiKeyInput());
    }

    createBackgroundParticles() {
        const particlesContainer = document.getElementById('backgroundParticles');
        if (!particlesContainer) return;
        const particleCount = 50;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 20 + 's';
            particle.style.animationDuration = (15 + Math.random() * 10) + 's';
            particlesContainer.appendChild(particle);
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

        const welcomeTitle = document.querySelector('.welcome-title');
        if (welcomeTitle) {
            welcomeTitle.textContent = `${greeting} Ready to chat?`;
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

        if (this.welcomeContainer) {
            this.welcomeContainer.style.animation = 'messageSlideOut 0.4s ease-in forwards';
            setTimeout(() => {
                this.welcomeContainer?.remove();
                this.welcomeContainer = null;
            }, 400);
        }

        this.addMessage('user', prompt);
        this.chatInput.value = '';
        this.autoResizeTextarea();
        this.setGeneratingState(true);

        const aiMessageContainer = this.createMessageElement('ai', '');
        const thinkingAnimation = this.createThinkingAnimation();
        aiMessageContainer.querySelector('.message-content').appendChild(thinkingAnimation);
        this.chatMessages.appendChild(aiMessageContainer);
        this.scrollToBottom();

        const contentDiv = aiMessageContainer.querySelector('.message-content');

        try {
            this.abortController = new AbortController();
            const signal = this.abortController.signal;
            const model = 'gemini-1.5-flash-latest';
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`;

            this.history.push({ role: "user", parts: [{ text: prompt }] });

            const payload = {
                contents: this.history,
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

            thinkingAnimation.remove();

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullResponse = "";
            let buffer = "";

            while (true) {
                if (this.isStopped) break;
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop();

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const json = JSON.parse(line.substring(6));
                            const textChunk = json.candidates[0]?.content?.parts[0]?.text || '';
                            if (textChunk) {
                                fullResponse += textChunk;
                                contentDiv.innerHTML = this.formatMessageContent(fullResponse);
                                this.scrollToBottom();
                            }
                        } catch (e) { /* Ignore malformed JSON */ }
                    }
                }
            }

            if (!this.isStopped) {
                this.history.push({ role: "model", parts: [{ text: fullResponse }] });
            }

        } catch (error) {
            thinkingAnimation.remove();
            if (error.name === 'AbortError') {
                contentDiv.innerHTML = this.formatMessageContent('🛑 Generation stopped.');
            } else {
                console.error('Error:', error);
                let errorMsg = '❌ Sorry, I encountered an error.';
                if (error.message.includes('API_KEY_INVALID')) {
                    errorMsg = '🔑 Invalid API key. Please check your key.';
                } else if (error.message.includes('QUOTA_EXCEEDED')) {
                    errorMsg = '📊 API quota exceeded.';
                }
                this.showError(errorMsg);
                contentDiv.innerHTML = this.formatMessageContent(errorMsg);
            }
        } finally {
            const messageDiv = contentDiv.closest('.message');
            if (messageDiv && !messageDiv.querySelector('.copy-button')) {
                const finalContent = this.isStopped ? 'Generation stopped.' : contentDiv.innerText;
                const copyButton = this.createCopyButton(finalContent);
                messageDiv.appendChild(copyButton);
            }
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
        messageDiv.className = `message ${sender} message-enter`;

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

        if (content) {
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

    createCopyButton(text) {
        const button = document.createElement('button');
        button.className = 'copy-button tooltip';
        button.setAttribute('data-tooltip', 'Copy to clipboard');
        button.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`;
        button.addEventListener('click', () => this.copyToClipboard(text, button));
        return button;
    }

    formatMessageContent(content) {
        let htmlContent = this.escapeHtml(content)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');

        htmlContent = htmlContent.replace(/```(\w*?)\n([\s\S]+?)```/g, (match, lang, code) => {
            const unescapedCode = code.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
            const codeIndex = this.allCodeBlocks.length;

            this.allCodeBlocks.push({
                code: unescapedCode.trim(),
                language: lang || 'text'
            });

            // MODIFIED: Added onclick to open the code viewer
            return `<pre onclick="window.geminiChat.openCodeViewer(${codeIndex})"><code class="language-${lang}">${this.escapeHtml(unescapedCode.trim())}</code></pre>`;
        })
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');

        return htmlContent;
    }

    escapeHtml(str) {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    setGeneratingState(isGenerating) {
        this.isGenerating = isGenerating;
        this.chatInput.disabled = isGenerating || !this.apiKeyInput.value.trim();
        this.sendButton.style.display = isGenerating ? 'none' : 'flex';
        this.stopButton.style.display = isGenerating ? 'flex' : 'none';
        this.updateSendButtonState();
        if (!isGenerating) this.chatInput.focus();
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
    }

    showError(message) {
        this.errorMessage.innerHTML = message;
        this.errorMessage.style.display = 'block';
    }

    hideError() {
        this.errorMessage.style.display = 'none';
    }

    async copyToClipboard(text, button) {
        try {
            const cleanText = new DOMParser().parseFromString(text, 'text/html').body.textContent || "";
            await navigator.clipboard.writeText(cleanText);
            button.classList.add('copied');
            button.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;
            button.setAttribute('data-tooltip', 'Copied!');
            setTimeout(() => {
                button.classList.remove('copied');
                button.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`;
                button.setAttribute('data-tooltip', 'Copy to clipboard');
            }, 2000);
        } catch (err) {
            this.showError('❌ Failed to copy');
        }
    }

    scrollToBottom() {
        requestAnimationFrame(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        });
    }

    // --- NEW & MODIFIED METHODS FOR CODE VIEWER ---

    openCodeViewer(index) {
        const codeBlock = this.allCodeBlocks[index];
        if (!codeBlock) return;

        this.currentCodeBlockIndex = index;

        const modal = document.getElementById('codeViewerModal');
        const title = document.getElementById('codeViewerTitle');
        const content = document.getElementById('codeViewerContent');

        title.textContent = `Code Viewer - ${codeBlock.language}`;
        content.textContent = codeBlock.code; // Use textContent to preserve formatting

        modal.classList.add('show');
    }

    closeCodeViewer() {
        const modal = document.getElementById('codeViewerModal');
        modal.classList.remove('show');
        this.currentCodeBlockIndex = null;
    }

    copyCodeContent() {
        if (this.currentCodeBlockIndex === null) return;
        const codeBlock = this.allCodeBlocks[this.currentCodeBlockIndex];
        if (!codeBlock) return;

        navigator.clipboard.writeText(codeBlock.code).then(() => {
            const copyButton = document.getElementById('copyCodeButton');
            copyButton.textContent = '📋 Copied!';
            setTimeout(() => {
                copyButton.textContent = '📋 Copy';
            }, 2000);
        }).catch(err => {
            this.showError('❌ Failed to copy code.');
        });
    }

    downloadCode() {
        if (this.currentCodeBlockIndex === null) return;
        const codeBlock = this.allCodeBlocks[this.currentCodeBlockIndex];
        if (!codeBlock) return;

        const blob = new Blob([codeBlock.code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `code.${codeBlock.language || 'txt'}`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // --- IMPORT / EXPORT / CLEAR ---

    clearChat() {
        this.history = [];
        this.allCodeBlocks = [];
        this.chatMessages.innerHTML = '';
        const welcomeMessage = document.createElement('div');
        welcomeMessage.innerHTML = `
                    <div class="welcome-message-container">
                        <div class="welcome-title">Chat Cleared ✨</div>
                        <div class="welcome-subtitle">Ready for a new conversation!</div>
                    </div>
                `;
        this.chatMessages.appendChild(welcomeMessage);
        this.welcomeContainer = this.chatMessages.querySelector('.welcome-message-container');
    }

    exportChat() {
        if (this.history.length === 0) {
            this.showError('❌ Nothing to export.');
            return;
        }
        const chatData = { timestamp: new Date().toISOString(), messages: this.history };
        const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gemini-chat-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.showSuccess('📥 Chat exported successfully!');
    }

    importChat() {
        const fileInput = document.getElementById('fileInput');
        fileInput.onchange = (e) => this.handleFileImport(e);
        fileInput.click();
    }

    handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (!importedData.messages || !Array.isArray(importedData.messages)) {
                    throw new Error("Invalid chat file format.");
                }

                this.clearChat();
                this.history = importedData.messages;
                this.chatMessages.innerHTML = '';

                this.history.forEach(message => {
                    const role = message.role === 'model' ? 'ai' : 'user';
                    const content = message.parts[0].text;
                    this.addMessage(role, content);
                });
                this.showSuccess('📤 Chat imported successfully!');

            } catch (error) {
                this.showError(`❌ Failed to import chat: ${error.message}`);
            } finally {
                event.target.value = '';
            }
        };
        reader.readAsText(file);
    }

    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `position: fixed; top: 20px; right: 20px; background: rgba(0, 255, 136, 0.2); color: var(--success-color); padding: 12px 20px; border-radius: 8px; border: 1px solid var(--success-color); backdrop-filter: blur(10px); z-index: 1000; animation: slideInRight 0.3s ease-out;`;
        successDiv.textContent = message;
        document.body.appendChild(successDiv);

        setTimeout(() => {
            successDiv.style.animation = 'slideOutRight 0.3s ease-in forwards';
            setTimeout(() => successDiv.remove(), 300);
        }, 3000);
    }
}

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        document.getElementById('sendButton')?.click();
    }
    if (e.key === 'Escape') {
        const modal = document.getElementById('codeViewerModal');
        if (modal.classList.contains('show')) {
            window.geminiChat?.closeCodeViewer();
        } else {
            document.getElementById('stopButton')?.click();
        }
    }
});

const style = document.createElement('style');
style.textContent = `@keyframes slideInRight { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); } } @keyframes slideOutRight { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(100%); } }`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', () => {
    window.geminiChat = new EnhancedGeminiChat();
});