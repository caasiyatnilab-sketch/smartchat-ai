// SmartChat AI Widget Script
// This is loaded by websites embedding your chatbots

(function() {
  const config = window.smartChatConfig || {};
  const chatbotId = config.chatbotId;
  const apiUrl = config.apiUrl || '';

  if (!chatbotId) {
    console.error('SmartChat: No chatbotId provided');
    return;
  }

  // Create widget container
  const widget = document.createElement('div');
  widget.className = 'smartchat-widget';
  widget.innerHTML = `
    <style>
      .smartchat-widget {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .smartchat-toggle {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: #3b82f6;
        color: white;
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        transition: transform 0.2s;
      }
      .smartchat-toggle:hover {
        transform: scale(1.05);
      }
      .smartchat-window {
        position: absolute;
        bottom: 80px;
        right: 0;
        width: 380px;
        height: 500px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.15);
        display: none;
        flex-direction: column;
        overflow: hidden;
      }
      .smartchat-window.open {
        display: flex;
      }
      .smartchat-header {
        background: #3b82f6;
        color: white;
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .smartchat-header-info h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }
      .smartchat-header-info p {
        margin: 0;
        font-size: 12px;
        opacity: 0.9;
      }
      .smartchat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .smartchat-message {
        max-width: 80%;
        padding: 12px 16px;
        border-radius: 16px;
        font-size: 14px;
        line-height: 1.5;
      }
      .smartchat-message.bot {
        background: #f3f4f6;
        color: #1f2937;
        align-self: flex-start;
        border-bottom-left-radius: 4px;
      }
      .smartchat-message.user {
        background: #3b82f6;
        color: white;
        align-self: flex-end;
        border-bottom-right-radius: 4px;
      }
      .smartchat-input-area {
        padding: 16px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        gap: 8px;
      }
      .smartchat-input {
        flex: 1;
        padding: 12px 16px;
        border: 1px solid #d1d5db;
        border-radius: 24px;
        font-size: 14px;
        outline: none;
        resize: none;
      }
      .smartchat-input:focus {
        border-color: #3b82f6;
      }
      .smartchat-send {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: #3b82f6;
        color: white;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
      }
      .smartchat-send:hover {
        background: #2563eb;
      }
      .smartchat-close {
        margin-left: auto;
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 20px;
        opacity: 0.8;
      }
      .smartchat-close:hover {
        opacity: 1;
      }
    </style>
    
    <button class="smartchat-toggle" title="Chat with us">💬</button>
    
    <div class="smartchat-window">
      <div class="smartchat-header">
        <span style="font-size: 24px">🤖</span>
        <div class="smartchat-header-info">
          <h3>AI Assistant</h3>
          <p>We typically reply in a few minutes</p>
        </div>
        <button class="smartchat-close">×</button>
      </div>
      
      <div class="smartchat-messages">
        <div class="smartchat-message bot">Hello! How can I help you today?</div>
      </div>
      
      <div class="smartchat-input-area">
        <input type="text" class="smartchat-input" placeholder="Type your message..." />
        <button class="smartchat-send">➤</button>
      </div>
    </div>
  `;

  document.body.appendChild(widget);

  // Elements
  const toggle = widget.querySelector('.smartchat-toggle');
  const window_ = widget.querySelector('.smartchat-window');
  const close = widget.querySelector('.smartchat-close');
  const input = widget.querySelector('.smartchat-input');
  const send = widget.querySelector('.smartchat-send');
  const messages = widget.querySelector('.smartchat-messages');

  // Generate or get visitor ID
  let visitorId = localStorage.getItem('smartchat_visitor_id');
  if (!visitorId) {
    visitorId = 'v_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('smartchat_visitor_id', visitorId);
  }

  // Toggle window
  toggle.addEventListener('click', () => {
    window_.classList.add('open');
    input.focus();
  });

  close.addEventListener('click', () => {
    window_.classList.remove('open');
  });

  // Send message
  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    // Add user message
    addMessage(text, 'user');
    input.value = '';

    try {
      const res = await fetch(`${apiUrl}/api/conversations/${chatbotId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, visitor_id: visitorId })
      });

      const data = await res.json();
      
      if (data.response) {
        addMessage(data.response, 'bot');
      } else {
        addMessage('Sorry, something went wrong. Please try again.', 'bot');
      }
    } catch (error) {
      console.error('SmartChat error:', error);
      addMessage('Sorry, I could not process your message. Please try again.', 'bot');
    }
  }

  function addMessage(text, role) {
    const msg = document.createElement('div');
    msg.className = `smartchat-message ${role}`;
    msg.textContent = text;
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
  }

  send.addEventListener('click', sendMessage);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Typing indicator (optional enhancement)
  function showTyping() {
    const typing = document.createElement('div');
    typing.className = 'smartchat-message bot typing';
    typing.innerHTML = '<span>•</span><span>•</span><span>•</span>';
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;
    return typing;
  }

})();