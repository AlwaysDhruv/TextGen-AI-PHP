<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>TextGen-AI</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="chat-container">
    <!-- Sidebar -->
    <div class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-title">Chat History</div>
        <button class="close-sidebar" onclick="toggleSidebar()">×</button>
      </div>
      <div class="chat-history">
        <div class="chat-item active">
          <div class="chat-item-title">AI Assistant</div>
          <div class="chat-item-preview">How can I help you today?</div>
        </div>
      </div>
    </div>

    <div class="overlay" id="overlay" onclick="toggleSidebar()"></div>

    <!-- Main Chat -->
    <div class="main-chat">
      <div class="chat-header">
        <div class="header-left">
          <button class="sidebar-toggle" onclick="toggleSidebar()">☰</button>
          <div class="chat-title">TextGen-AI</div>
        </div>
        <?php include("icon.php"); ?>
      </div>

      <div class="chat-messages" id="chatMessages">
        <div class="message output-wrapper">
          <div class="message-avatar ai">TGI</div>
          <div class="message-content">
            <pre class="output-content message-text">Hello 👋 I'm your AI assistant. How can I help you today?</pre>
            <button class="copy-btn tooltip" onclick="copyMessage(this)" title="Copy to clipboard">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1z"/>
                <path d="M20 5H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h12v14z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Input -->
      <div class="input-area">
        <form class="input-container" id="chatForm">
          <textarea class="message-input" id="messageInput" placeholder="Type your message here..." rows="1" onkeypress="handleKeyPress(event)" oninput="autoResize(this)"></textarea>
          <button class="send-btn" type="submit">➤</button>
        </form>
      </div>
    </div>
  </div>

  <script src="chat.js"></script>
</body>
</html>