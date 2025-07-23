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

function copyMessage(button) {
  const text = button.previousElementSibling.innerText;
  navigator.clipboard.writeText(text).then(() => {
    button.textContent = "✅";
    setTimeout(() => {
      button.textContent = "📋";
    }, 1000);
  });
}

document.getElementById("chatForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const input = document.getElementById("messageInput");
  const message = input.value.trim();
  if (!message) return;

const userMsg = document.createElement("div");
userMsg.className = "message user";
userMsg.innerHTML = `
  <div class="message-avatar user">You</div>
  <div class="message-content"><span class="message-text">${message}</span></div>`;
document.getElementById("chatMessages").appendChild(userMsg);

  input.value = "";
  autoResize(input);

  fetch("chat.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "prompt=" + encodeURIComponent(message)
  })
    .then(res => res.json())
    .then(data => {
      const aiMsg = document.createElement("div");
      aiMsg.className = "message";
      aiMsg.innerHTML = `
        <div class="message-avatar ai">TG</div>
        <div class="message-content">
          <span class="message-text">${data.response}</span>
          <span class="copy-btn" onclick="copyMessage(this)">📋</span>
        </div>`;
      document.getElementById("chatMessages").appendChild(aiMsg);
    })
    .catch(err => {
      console.error("Error:", err);
    });
});