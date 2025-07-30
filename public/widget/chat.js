(function () {
  "use strict";

  // Check if widget is already initialized to prevent conflicts
  if (window.lyzrChatWidget) {
    // Clean up existing widget
    const existingWidget = document.querySelector('.lyzr-chat-widget')
    if (existingWidget) {
      existingWidget.remove()
    }
  }

  // Get the script tag and extract agent ID
  const currentScript =
    document.currentScript || document.querySelector("script[data-agent-id]");
  const agentId = currentScript?.getAttribute("data-agent-id");

  if (!agentId) {
    console.error("Lyzr Chat Widget: data-agent-id attribute is required");
    return;
  }

  // Configuration
  const config = {
    agentId: agentId,
    apiBaseUrl: currentScript?.getAttribute("data-api-url"),
    position: currentScript?.getAttribute("data-position") || "bottom-right",
    primaryColor:
      currentScript?.getAttribute("data-primary-color") || "#007bff",
    title: currentScript?.getAttribute("data-title") || "Chat Support",
    subtitle:
      currentScript?.getAttribute("data-subtitle") ||
      "How can we help you today?",
  };

  // Validate required configuration
  if (!config.apiBaseUrl) {
    console.error("Lyzr Chat Widget: data-api-url attribute is required");
    console.error("Example usage:");
    console.error('<script src="https://yourdomain.com/widget/chat.js" data-agent-id="agent123" data-api-url="https://yourdomain.com"></script>');
    return;
  }

  // Normalize API URL (remove trailing slash)
  config.apiBaseUrl = config.apiBaseUrl.replace(/\/$/, '');

  // Handle protocol-relative URLs
  if (config.apiBaseUrl.startsWith('//')) {
    config.apiBaseUrl = window.location.protocol + config.apiBaseUrl;
  }

  // Validate API URL format
  try {
    new URL(config.apiBaseUrl);
  } catch {
    console.error("Lyzr Chat Widget: Invalid data-api-url format:", config.apiBaseUrl);
    console.error("Please provide a valid URL like: https://yourdomain.com");
    return;
  }

  // Generate unique session ID
  function generateSessionId() {
    return (
      "session_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now()
    );
  }

  // Get or create session ID
  function getSessionId() {
    let sessionId = localStorage.getItem("lyzr_chat_session_" + config.agentId);
    if (!sessionId) {
      sessionId = generateSessionId();
      localStorage.setItem("lyzr_chat_session_" + config.agentId, sessionId);
    }
    return sessionId;
  }

  // Create styles
  function createStyles() {
    const styles = `
      .lyzr-chat-widget {
        position: fixed;
        ${config.position.includes("right") ? "right: 20px;" : "left: 20px;"}
        ${config.position.includes("bottom") ? "bottom: 20px;" : "top: 20px;"}
        z-index: 1000;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      
      .lyzr-chat-button {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background-color: ${config.primaryColor};
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 24px;
        transition: all 0.3s ease;
      }
      
      .lyzr-chat-button:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
      }
      
      .lyzr-chat-window {
        position: absolute;
        ${config.position.includes("right") ? "right: 0;" : "left: 0;"}
        bottom: 80px;
        width: 350px;
        height: 500px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        display: none;
        flex-direction: column;
        overflow: hidden;
      }
      
      .lyzr-chat-window.open {
        display: flex;
        animation: slideUp 0.3s ease-out;
      }
      
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .lyzr-chat-header {
        background-color: ${config.primaryColor};
        color: white;
        padding: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .lyzr-chat-title {
        font-size: 16px;
        font-weight: 600;
        margin: 0;
      }
      
      .lyzr-chat-subtitle {
        font-size: 12px;
        opacity: 0.9;
        margin: 0;
      }
      
      .lyzr-chat-close {
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .lyzr-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .lyzr-chat-message {
        max-width: 80%;
        padding: 8px 12px;
        border-radius: 12px;
        font-size: 14px;
        line-height: 1.4;
      }
      
      .lyzr-chat-message.user {
        background-color: ${config.primaryColor};
        color: white;
        align-self: flex-end;
        border-bottom-right-radius: 4px;
      }
      
      .lyzr-chat-message.agent {
        background-color: #f1f3f5;
        color: #333;
        align-self: flex-start;
        border-bottom-left-radius: 4px;
      }
      
      .lyzr-chat-input-container {
        padding: 16px;
        border-top: 1px solid #e9ecef;
        display: flex;
        gap: 8px;
      }
      
      .lyzr-chat-input {
        flex: 1;
        border: 1px solid #ddd;
        border-radius: 20px;
        padding: 8px 16px;
        font-size: 14px;
        outline: none;
        resize: none;
        min-height: 20px;
        max-height: 60px;
      }
      
      .lyzr-chat-input:focus {
        border-color: ${config.primaryColor};
      }
      
      .lyzr-chat-send {
        background-color: ${config.primaryColor};
        border: none;
        border-radius: 50%;
        width: 36px;
        height: 36px;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
      }
      
      .lyzr-chat-send:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .lyzr-chat-typing {
        display: none;
        align-self: flex-start;
        background-color: #f1f3f5;
        color: #666;
        padding: 8px 12px;
        border-radius: 12px;
        border-bottom-left-radius: 4px;
        font-size: 14px;
        font-style: italic;
      }
      
      .lyzr-chat-typing.show {
        display: block;
      }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  // Create widget HTML
  function createWidget() {
    const widget = document.createElement("div");
    widget.className = "lyzr-chat-widget";
    widget.innerHTML = `
      <button class="lyzr-chat-button" id="lyzr-chat-toggle">
        💬
      </button>
      <div class="lyzr-chat-window" id="lyzr-chat-window">
        <div class="lyzr-chat-header">
          <div>
            <div class="lyzr-chat-title">${config.title}</div>
            <div class="lyzr-chat-subtitle">${config.subtitle}</div>
          </div>
          <button class="lyzr-chat-close" id="lyzr-chat-close">×</button>
        </div>
        <div class="lyzr-chat-messages" id="lyzr-chat-messages">
          <div class="lyzr-chat-message agent">
            Hello! I'm your AI assistant. How can I help you today?
          </div>
        </div>
        <div class="lyzr-chat-typing" id="lyzr-chat-typing">
          Agent is typing...
        </div>
        <div class="lyzr-chat-input-container">
          <textarea 
            class="lyzr-chat-input" 
            id="lyzr-chat-input" 
            placeholder="Type your message..."
            rows="1"
          ></textarea>
          <button class="lyzr-chat-send" id="lyzr-chat-send">→</button>
        </div>
      </div>
    `;

    document.body.appendChild(widget);
    return widget;
  }

  // Add message to chat
  function addMessage(text, isUser = false) {
    const messagesContainer = document.getElementById("lyzr-chat-messages");
    const message = document.createElement("div");
    message.className = `lyzr-chat-message ${isUser ? "user" : "agent"}`;
    message.textContent = text;
    messagesContainer.appendChild(message);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Show/hide typing indicator
  function showTyping(show = true) {
    const typingIndicator = document.getElementById("lyzr-chat-typing");
    typingIndicator.className = `lyzr-chat-typing ${show ? "show" : ""}`;

    const messagesContainer = document.getElementById("lyzr-chat-messages");
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Send message to API
  async function sendMessage(message) {
    try {
      const sessionId = getSessionId();
      const visitorInfo = {
        name: localStorage.getItem("lyzr_visitor_name_" + config.agentId),
        email: localStorage.getItem("lyzr_visitor_email_" + config.agentId),
        userAgent: navigator.userAgent,
        ipAddress: null, // Would need server-side detection
      };

      const response = await fetch(`${config.apiBaseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agent_id: config.agentId,
          session_id: sessionId,
          message: message,
          visitor_info: visitorInfo,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        return data.response;
      } else {
        throw new Error(data.error || "Failed to get response");
      }
    } catch (error) {
      console.error("Chat error:", error);
      console.error("API URL:", config.apiBaseUrl);
      console.error("Agent ID:", config.agentId);
      return "Sorry, I encountered an error. Please try again later.";
    }
  }

  // Handle sending message
  async function handleSendMessage() {
    const input = document.getElementById("lyzr-chat-input");
    const sendButton = document.getElementById("lyzr-chat-send");
    const message = input.value.trim();

    if (!message) return;

    // Add user message
    addMessage(message, true);
    input.value = "";

    // Disable input
    input.disabled = true;
    sendButton.disabled = true;
    showTyping(true);

    // Send to API and get response
    const response = await sendMessage(message);

    // Hide typing and add response
    showTyping(false);
    addMessage(response, false);

    // Re-enable input
    input.disabled = false;
    sendButton.disabled = false;
    input.focus();
  }

  // Auto-resize textarea
  function autoResize(textarea) {
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 60) + "px";
  }

  // Initialize widget
  function init() {
    // Create styles and widget
    createStyles();
    createWidget();

    // Get elements
    const toggleButton = document.getElementById("lyzr-chat-toggle");
    const chatWindow = document.getElementById("lyzr-chat-window");
    const closeButton = document.getElementById("lyzr-chat-close");
    const input = document.getElementById("lyzr-chat-input");
    const sendButton = document.getElementById("lyzr-chat-send");

    // Event listeners
    toggleButton.addEventListener("click", () => {
      chatWindow.classList.toggle("open");
      if (chatWindow.classList.contains("open")) {
        input.focus();
      }
    });

    closeButton.addEventListener("click", () => {
      chatWindow.classList.remove("open");
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    });

    input.addEventListener("input", () => {
      autoResize(input);
    });

    sendButton.addEventListener("click", handleSendMessage);

    // Mark widget as initialized
    window.lyzrChatWidget = {
      agentId: config.agentId,
      initialized: true
    };

    console.log("Lyzr Chat Widget initialized for agent:", config.agentId);
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
