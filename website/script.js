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
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");

window.addEventListener("load", () => {
  window.setTimeout(() => loader?.classList.add("hidden"), 720);
});

window.addEventListener("scroll", () => {
  header?.classList.toggle("scrolled", window.scrollY > 28);
}, { passive: true });

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("visible");
    revealObserver.unobserve(entry.target);
  });
}, { threshold: .12, rootMargin: "0px 0px -35px" });

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

menuButton?.addEventListener("click", () => {
  const open = navigation.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "\u30e1\u30cb\u30e5\u30fc\u3092\u9589\u3058\u308b" : "\u30e1\u30cb\u30e5\u30fc\u3092\u958b\u304f");
});

navigation?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
  navigation.classList.remove("open");
  menuButton?.setAttribute("aria-expanded", "false");
  menuButton?.setAttribute("aria-label", "\u30e1\u30cb\u30e5\u30fc\u3092\u958b\u304f");
}));

function setChat(open) {
  chatPanel?.classList.toggle("open", open);
  chatPanel?.setAttribute("aria-hidden", String(!open));
  chatLauncher?.setAttribute("aria-expanded", String(open));
  document.body.classList.toggle("chat-open", open && innerWidth < 721);
  if (open) window.setTimeout(() => chatInput?.focus(), 250);
}

chatLauncher?.addEventListener("click", () => setChat(!chatPanel?.classList.contains("open")));
chatClose?.addEventListener("click", () => setChat(false));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setChat(false);
    navigation?.classList.remove("open");
    menuButton?.setAttribute("aria-expanded", "false");
  }
});

function appendMessage(text, sender = "bot") {
  const message = document.createElement("div");
  message.className = `message ${sender}`;
  message.textContent = text;
  chatMessages?.append(message);
  if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
  return message;
}

function appendLineSupport() {
  const link = document.createElement("a");
  link.className = "line-support";
  link.href = lineSupportUrl;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = "LINE\u3067\u30b5\u30dd\u30fc\u30c8\u306b\u76f8\u8ac7\u3059\u308b \u2192";
  chatMessages?.append(link);
  if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendQuestion(question) {
  const cleanQuestion = question.trim();
  if (!cleanQuestion || chatForm?.classList.contains("is-sending")) return;

  appendMessage(cleanQuestion, "user");
  conversationHistory.push({ role: "user", content: cleanQuestion });
  chatInput.value = "";
  chatForm.classList.add("is-sending");
  chatInput.disabled = true;
  const typing = appendMessage("\u30de\u30cb\u30e5\u30a2\u30eb\u3092\u78ba\u8a8d\u3057\u3066\u3044\u307e\u3059\u2026");
  typing.classList.add("typing");

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: cleanQuestion, history: conversationHistory.slice(-6) })
    });
    const payload = await response.json();
    typing.remove();
    if (!response.ok && !payload.answer) throw new Error(payload.error || "ChatBot request failed");

    const answer = payload.answer || "\u56de\u7b54\u3092\u53d6\u5f97\u3067\u304d\u307e\u305b\u3093\u3067\u3057\u305f\u3002LINE\u30b5\u30dd\u30fc\u30c8\u3078\u3054\u76f8\u8ac7\u304f\u3060\u3055\u3044\u3002";
    appendMessage(answer);
    conversationHistory.push({ role: "assistant", content: answer });
    if (payload.resolved !== true) appendLineSupport();
  } catch {
    typing.remove();
    const answer = "\u73fe\u5728\u30b5\u30dd\u30fc\u30c8\u306b\u63a5\u7d9a\u3067\u304d\u307e\u305b\u3093\u3002LINE\u30b5\u30dd\u30fc\u30c8\u3078\u3054\u76f8\u8ac7\u304f\u3060\u3055\u3044\u3002";
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

if (matchMedia("(pointer: fine)").matches && !reduceMotion.matches) {
  document.querySelectorAll(".magnetic").forEach((button) => {
    button.addEventListener("mousemove", (event) => {
      const box = button.getBoundingClientRect();
      const x = event.clientX - box.left - box.width / 2;
      const y = event.clientY - box.top - box.height / 2;
      button.style.transform = `translate(${x * .06}px, ${y * .08}px)`;
    });
    button.addEventListener("mouseleave", () => { button.style.transform = ""; });
  });
}
