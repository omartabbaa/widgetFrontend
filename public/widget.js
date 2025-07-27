(function() {
  'use strict';

  // Widget configuration from script attributes
  const script = document.currentScript || document.querySelector('script[src*="widget.js"]');
  const config = {
    apiKey: script.getAttribute('data-api-key') || '6xkaCIxXOdEqUeb55pOR0gTnsHK_1sDq',
    businessId: script.getAttribute('data-business-id') || '2',
    position: script.getAttribute('data-position') || 'bottom-left',
    theme: script.getAttribute('data-theme') || 'dark',
    autoOpen: script.getAttribute('data-auto-open') === 'true'
  };

  // Backend configuration - using the Vite proxy to backend
  const BACKEND_URL = 'http://localhost:5175'; // This will be proxied to localhost:8080

  // Widget CSS styles
  const widgetCSS = `
    .ai-widget {
      position: fixed;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ${config.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
      ${config.position.includes('left') ? 'left: 20px;' : 'right: 20px;'}
    }

    .ai-widget-button {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: ${config.theme === 'dark' ? 
        'linear-gradient(135deg, #2d3748 0%, #4a5568 100%)' : 
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
      transition: all 0.3s ease;
      position: relative;
    }

    .ai-widget-button:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 25px rgba(0, 0, 0, 0.4);
    }

    .ai-widget-panel {
      position: absolute;
      ${config.position.includes('bottom') ? 'bottom: 70px;' : 'top: 70px;'}
      ${config.position.includes('left') ? 'left: 0;' : 'right: 0;'}
      width: 350px;
      height: 500px;
      background: ${config.theme === 'dark' ? '#1a202c' : '#ffffff'};
      border-radius: 15px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      overflow: hidden;
      display: none;
      flex-direction: column;
    }

    .ai-widget-panel.open {
      display: flex;
      animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .ai-widget-header {
      background: ${config.theme === 'dark' ? 
        'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)' : 
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
      color: white;
      padding: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .ai-widget-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }

    .ai-close-btn {
      background: none;
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .ai-widget-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: ${config.theme === 'dark' ? '#2d3748' : '#f7fafc'};
    }

    .ai-chat {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .ai-chat-messages {
      flex: 1;
      padding: 15px;
      overflow-y: auto;
      background: ${config.theme === 'dark' ? '#2d3748' : '#f7fafc'};
    }

    .ai-message {
      margin-bottom: 15px;
      max-width: 80%;
      padding: 10px 15px;
      border-radius: 15px;
      font-size: 14px;
      line-height: 1.4;
    }

    .ai-message.user {
      background: #667eea;
      color: white;
      margin-left: auto;
      border-bottom-right-radius: 5px;
    }

    .ai-message.ai {
      background: ${config.theme === 'dark' ? '#4a5568' : '#ffffff'};
      color: ${config.theme === 'dark' ? '#e2e8f0' : '#2d3748'};
      border-bottom-left-radius: 5px;
    }

    .ai-message.loading {
      background: ${config.theme === 'dark' ? '#4a5568' : '#ffffff'};
      color: ${config.theme === 'dark' ? '#e2e8f0' : '#2d3748'};
      border-bottom-left-radius: 5px;
      font-style: italic;
      opacity: 0.7;
    }

    .ai-chat-input {
      display: flex;
      padding: 15px;
      background: ${config.theme === 'dark' ? '#4a5568' : '#e2e8f0'};
      gap: 10px;
    }

    .ai-chat-input input {
      flex: 1;
      padding: 10px 15px;
      border: none;
      border-radius: 20px;
      background: ${config.theme === 'dark' ? '#2d3748' : '#ffffff'};
      color: ${config.theme === 'dark' ? '#e2e8f0' : '#2d3748'};
      outline: none;
      font-size: 14px;
    }

    .ai-chat-send {
      padding: 10px 20px;
      border: none;
      border-radius: 20px;
      background: #667eea;
      color: white;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s;
    }

    .ai-chat-send:hover {
      background: #5a67d8;
    }

    .ai-chat-send:disabled {
      background: #a0aec0;
      cursor: not-allowed;
    }

    .ai-notification {
      position: absolute;
      top: -35px;
      ${config.position.includes('left') ? 'left: 0;' : 'right: 0;'}
      background: #667eea;
      color: white;
      padding: 8px 12px;
      border-radius: 15px;
      font-size: 12px;
      white-space: nowrap;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      display: none;
      animation: bounce 2s infinite;
    }

    .ai-notification:after {
      content: '';
      position: absolute;
      top: 100%;
      ${config.position.includes('left') ? 'left: 20px;' : 'right: 20px;'}
      border: 5px solid transparent;
      border-top-color: #667eea;
    }

    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-5px); }
      60% { transform: translateY(-3px); }
    }

    .ai-error {
      background: #f56565;
      color: white;
      padding: 10px;
      border-radius: 8px;
      margin: 10px;
      font-size: 12px;
    }
  `;

  // Create widget HTML
  function createWidget() {
    const widgetHTML = `
      <div class="ai-widget">
        <div class="ai-notification" id="ai-notification">
          🧠 AI Assistant Ready!
        </div>
        <button class="ai-widget-button" id="ai-toggle">
          🧠
        </button>
        <div class="ai-widget-panel" id="ai-panel">
          <div class="ai-widget-header">
            <h3>🧠 AI Assistant</h3>
            <button class="ai-close-btn" id="ai-close">✕</button>
          </div>
          <div class="ai-widget-content">
            <div class="ai-chat">
              <div class="ai-chat-messages" id="ai-messages">
                <div class="ai-message ai">
                  Hello! I'm your AI assistant connected to the backend. How can I help you today?
                </div>
              </div>
              <div class="ai-chat-input">
                <input type="text" placeholder="Type your message..." id="ai-input" onkeypress="window.AIWidget.handleKeyPress(event)">
                <button class="ai-chat-send" onclick="window.AIWidget.sendMessage()" id="ai-send">Send</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    return widgetHTML;
  }

  // Widget functionality
  const AIWidget = {
    isOpen: false,
    conversationId: null,
    isProcessing: false,

    init() {
      // Add CSS styles
      const style = document.createElement('style');
      style.textContent = widgetCSS;
      document.head.appendChild(style);

      // Add widget HTML
      const widgetContainer = document.createElement('div');
      widgetContainer.innerHTML = createWidget();
      document.body.appendChild(widgetContainer.firstElementChild);

      // Add event listeners
      document.getElementById('ai-toggle').addEventListener('click', this.toggle.bind(this));
      document.getElementById('ai-close').addEventListener('click', this.close.bind(this));

      // Auto-open if configured
      if (config.autoOpen) {
        setTimeout(() => this.open(), 1000);
      }

      // Show notification after delay
      setTimeout(() => {
        if (!this.isOpen) {
          document.getElementById('ai-notification').style.display = 'flex';
        }
      }, 3000);

      console.log(`AI Widget initialized - API Key: ${config.apiKey}, Business ID: ${config.businessId}, Position: ${config.position}, Theme: ${config.theme}`);
      console.log(`Backend URL: ${BACKEND_URL} (proxied to localhost:8080)`);
    },

    toggle() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    },

    open() {
      document.getElementById('ai-panel').classList.add('open');
      document.getElementById('ai-notification').style.display = 'none';
      this.isOpen = true;
    },

    close() {
      document.getElementById('ai-panel').classList.remove('open');
      this.isOpen = false;
    },

    handleKeyPress(event) {
      if (event.key === 'Enter' && !this.isProcessing) {
        this.sendMessage();
      }
    },

    async sendMessage() {
      if (this.isProcessing) return;

      const input = document.getElementById('ai-input');
      const sendButton = document.getElementById('ai-send');
      const message = input.value.trim();
      
      if (!message) return;

      this.isProcessing = true;
      sendButton.disabled = true;
      input.disabled = true;

      // Add user message
      this.addMessage('user', message);
      input.value = '';

      // Show loading message
      const loadingId = Date.now();
      this.addMessage('ai', '🤔 Thinking...', loadingId);

      try {
        // Prepare request to backend
        const requestData = {
          message: message,
          businessId: config.businessId,
          userId: this.getUserId(),
          conversationId: this.conversationId
        };

        const headers = {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        };

        // Add API key if provided
        if (config.apiKey && config.apiKey !== 'YOUR_API_KEY') {
          headers['X-API-KEY'] = config.apiKey;
        }

        console.log('Sending request to backend:', requestData);

        // Send request to backend (proxied through Vite to localhost:8080)
        const response = await fetch(`${BACKEND_URL}/api/chat`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(requestData)
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Backend response:', data);
        
        // Remove loading message
        this.removeMessage(loadingId);
        
        // Add AI response from backend
        this.addMessage('ai', data.response || data.message || 'Sorry, I couldn\'t process your request.');
        
        // Update conversation ID if provided
        if (data.conversationId) {
          this.conversationId = data.conversationId;
        }
        
        // Track conversation
        await this.trackConversation({
          userMessage: message,
          aiResponse: data.response || data.message,
          conversationId: this.conversationId,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error('Error getting AI response:', error);
        
        // Remove loading message
        this.removeMessage(loadingId);
        
        // Show error message
        this.addMessage('ai', 'Sorry, I encountered an error connecting to the backend. Please try again.');
        
        // Add error details for debugging
        const errorDiv = document.createElement('div');
        errorDiv.className = 'ai-error';
        errorDiv.textContent = `Error: ${error.message}`;
        document.getElementById('ai-messages').appendChild(errorDiv);
      } finally {
        this.isProcessing = false;
        sendButton.disabled = false;
        input.disabled = false;
        input.focus();
      }
    },

    addMessage(sender, text, messageId = null) {
      const messagesContainer = document.getElementById('ai-messages');
      const messageDiv = document.createElement('div');
      messageDiv.className = `ai-message ${sender}`;
      messageDiv.textContent = text;
      if (messageId) {
        messageDiv.setAttribute('data-message-id', messageId);
      }
      messagesContainer.appendChild(messageDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },

    removeMessage(messageId) {
      const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
      if (messageElement) {
        messageElement.remove();
      }
    },

    getUserId() {
      let userId = localStorage.getItem('ai-widget-user-id');
      if (!userId) {
        userId = `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        localStorage.setItem('ai-widget-user-id', userId);
      }
      return userId;
    },

    async trackConversation(data) {
      try {
        // Send conversation data to backend
        const headers = {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        };

        if (config.apiKey && config.apiKey !== 'YOUR_API_KEY') {
          headers['X-API-KEY'] = config.apiKey;
        }

        await fetch(`${BACKEND_URL}/api/conversations/track`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            ...data,
            businessId: config.businessId,
            apiKey: config.apiKey
          })
        });

        console.log('Conversation tracked successfully:', data);
      } catch (error) {
        console.error('Error tracking conversation:', error);
        
        // Fallback: store in localStorage
        const conversations = JSON.parse(localStorage.getItem('ai-widget-conversations') || '[]');
        conversations.push(data);
        localStorage.setItem('ai-widget-conversations', JSON.stringify(conversations));
      }
    }
  };

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AIWidget.init());
  } else {
    AIWidget.init();
  }

  // Expose to global scope
  window.AIWidget = AIWidget;

})(); 