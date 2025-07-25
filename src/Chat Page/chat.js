function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("active");
  document.getElementById("overlay").classList.toggle("active");
}

function autoResize(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = textarea.scrollHeight + "px";
}

function handleKeyPress(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    document.getElementById("chatForm").dispatchEvent(new Event("submit"));
  }
}

function scrollToBottom() {
  const chatMessages = document.getElementById("chatMessages");
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function createMessageElement(type, messageText) {
  const msg = document.createElement("div");
  msg.className = `message ${type === 'user' ? 'user' : ''}`;
  const avatar = type === 'user' ? 'You' : 'TG';
  const icon = type === 'user' ? '' : `
    <button class="copy-btn tooltip" onclick="copyMessage(this)" title="Copy to clipboard">
      <img src="8001449.png" alt="Copy" class="copy-icon" />
    </button>`;

  msg.innerHTML = `
    <div class="message-avatar ${type}">${avatar}</div>
    <div class="message-content">
      <span class="message-text">${messageText}</span>
      ${icon}
    </div>`;
  return msg;
}

document.getElementById("chatForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const input = document.getElementById("messageInput");
  const message = input.value.trim();
  if (!message) return;

  const userMsg = createMessageElement('user', message);
  document.getElementById("chatMessages").appendChild(userMsg);
  scrollToBottom();

  input.value = "";
  autoResize(input);

  fetch("chat.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "prompt=" + encodeURIComponent(message)
  })
    .then(res => res.json())
    .then(data => {
      const aiMsg = createMessageElement('ai', data.response);
      document.getElementById("chatMessages").appendChild(aiMsg);
      scrollToBottom();
    })
    .catch(err => {
      console.error("Error:", err);
    });
});

function copyMessage(button) {
  const output = button.parentElement.querySelector(".message-text");
  const text = output.innerText || output.textContent;
  const img = button.querySelector("img");

  navigator.clipboard.writeText(text).then(() => {
    img.src = "1621635.png"; // success icon
    img.alt = "Copied";

    setTimeout(() => {
      img.src = "8001449.png"; // restore icon
      img.alt = "Copy";
    }, 1500);
  }).catch(err => {
    console.error("Copy failed:", err);
  });
}