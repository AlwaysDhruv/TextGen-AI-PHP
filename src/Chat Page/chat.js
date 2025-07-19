function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("active");
  document.getElementById("overlay").classList.toggle("active");
}

function handleKeyPress(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    document.getElementById("chatForm").requestSubmit();
  }
}

function autoResize(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}

document.getElementById("chatForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const input = document.getElementById("messageInput");
  const message = input.value.trim();
  if (!message) return;

  addMessage(message, 'user');
  input.value = '';
  input.style.height = 'auto';

  const aiMsg = addMessage('', 'ai');

  const response = await fetch("chat.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "prompt=" + encodeURIComponent(message)
  });

  const data = await response.json();
  if (data.response) {
    typeWriter(aiMsg.querySelector(".message-content"), data.response.trim());
  }
});

function addMessage(text, sender) {
  const chatMessages = document.getElementById("chatMessages");
  const msg = document.createElement("div");
  msg.className = `message ${sender}`;
  msg.innerHTML = `
    <div class="message-avatar ${sender}">${sender === 'user' ? 'U' : 'AI'}</div>
    <div class="message-content">${text.replace(/\n/g, '<br>')}</div>
  `;
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return msg;
}

function typeWriter(element, text, i = 0) {
  if (i < text.length) {
    element.innerHTML += text.charAt(i) === '\n' ? '<br>' : text.charAt(i);
    setTimeout(() => typeWriter(element, text, i + 1), 15);
  }
}