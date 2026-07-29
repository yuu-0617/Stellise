const loader = document.querySelector("#loader");
const header = document.querySelector("#header");
const menuButton = document.querySelector(".menu-button");
const navigation = document.querySelector(".site-header nav");
const chatLauncher = document.querySelector(".chat-launcher");
const chatPanel = document.querySelector(".chat-panel");
const chatClose = document.querySelector(".chat-close");
const chatForm = document.querySelector(".chat-form");
const chatInput = document.querySelector("#chat-input");
const chatMessages = document.querySelector(".chat-messages");
const lineSupportUrl = "https://lin.ee/pzygyU4";
const conversationHistory = [];

window.addEventListener("load", () => {
  window.setTimeout(() => loader?.classList.add("hidden"), 650);
});

window.addEventListener("scroll", () => {
  header?.classList.toggle("scrolled", window.scrollY > 30);
}, { passive: true });

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: .12 });

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

menuButton?.addEventListener("click", () => {
  const open = navigation.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(open));
});

navigation?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
  navigation.classList.remove("open");
  menuButton?.setAttribute("aria-expanded", "false");
}));

function setChat(open) {
  chatPanel.classList.toggle("open", open);
  chatPanel.setAttribute("aria-hidden", String(!open));
  chatLauncher.setAttribute("aria-expanded", String(open));
  if (open) window.setTimeout(() => chatInput.focus(), 250);
}

chatLauncher?.addEventListener("click", () => setChat(!chatPanel.classList.contains("open")));
chatClose?.addEventListener("click", () => setChat(false));

function appendMessage(text, sender = "bot") {
  const message = document.createElement("div");
  message.className = `message ${sender}`;
  message.textContent = text;
  chatMessages.append(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return message;
}

function appendLineSupport() {
  const link = document.createElement("a");
  link.className = "line-support";
  link.href = lineSupportUrl;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = "LINEでサポートに相談する ↗";
  chatMessages.append(link);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendQuestion(question) {
  const cleanQuestion = question.trim();
  if (!cleanQuestion || chatForm.classList.contains("is-sending")) return;

  appendMessage(cleanQuestion, "user");
  conversationHistory.push({ role: "user", content: cleanQuestion });
  chatInput.value = "";
  chatForm.classList.add("is-sending");
  chatInput.disabled = true;
  const typing = appendMessage("マニュアルを確認しています…", "bot");
  typing.classList.add("typing");

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: cleanQuestion, history: conversationHistory.slice(-6) })
    });
    const payload = await response.json();
    typing.remove();

    if (!response.ok && !payload.answer) {
      throw new Error(payload.error || "ChatBot request failed");
    }

    const answer = payload.answer || "回答を取得できませんでした。LINEサポートへご相談ください。";
    appendMessage(answer);
    conversationHistory.push({ role: "assistant", content: answer });
    if (payload.resolved !== true) appendLineSupport();
  } catch {
    typing.remove();
    const answer = "現在AIサポートに接続できません。LINEサポートへご相談ください。";
    appendMessage(answer);
    conversationHistory.push({ role: "assistant", content: answer });
    appendLineSupport();
  } finally {
    chatForm.classList.remove("is-sending");
    chatInput.disabled = false;
    chatInput.focus();
  }
}

chatForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  sendQuestion(chatInput.value);
});

document.querySelectorAll(".quick-replies button").forEach((button) => {
  button.addEventListener("click", () => sendQuestion(button.textContent));
});

if (matchMedia("(pointer: fine)").matches) {
  document.querySelectorAll(".magnetic").forEach((button) => {
    button.addEventListener("mousemove", (event) => {
      const box = button.getBoundingClientRect();
      const x = event.clientX - box.left - box.width / 2;
      const y = event.clientY - box.top - box.height / 2;
      button.style.transform = `translate(${x * .08}px, ${y * .1}px)`;
    });
    button.addEventListener("mouseleave", () => { button.style.transform = ""; });
  });
}
