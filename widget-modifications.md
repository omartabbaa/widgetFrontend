# Widget Component Modifications

This document outlines the necessary modifications to transform the widget.jsx file to use the new UI structure with dynamic configuration from the backend.

## 1. Import Statement Updates

Replace the current import statements with:

```jsx
import React, { useState, useEffect, useRef } from "react";
import "./widget.css";
import LoginForm from "../components/LoginForm";
import SignupForm from "../components/SignupForm";
import Icon from "../components/Icon";
import { BACKEND_URL, getAuthHeaders } from '../config';
import { useAuth } from '../context/AuthContext';
import { usePersonalizedAnswer } from '../context/PersonalizedAnswerContext';
import Cookies from 'js-cookie';
```

## 2. Add New State Variables

Add these new state variables to the existing ones in the Widget component:

```jsx
const Widget = () => {
  // Existing state variables...
  
  // Widget visibility and configuration
  const [isWidgetWindowOpen, setIsWidgetWindowOpen] = useState(false);
  const [widgetConfig, setWidgetConfig] = useState({
    headerText: 'AI Chat Assistant',
    welcomeMessage: 'Hello! How can I help you today?',
    primaryColor: '#007bff',
    secondaryColor: '#ffffff',
    textColor: '#333333',
    fontFamily: 'Arial, sans-serif',
    widgetPosition: 'bottom-right',
    launcherIcon: 'chat_bubble',
    widgetShape: 'rounded', // 'rounded' or 'square'
    showWelcomeMessage: true
  });
  const [configLoadingError, setConfigLoadingError] = useState(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  
  // Continue with existing state variables...
```

## 3. Add Material Icons useEffect

Add this useEffect hook after your existing useEffects:

```jsx
// Load Material Icons stylesheet
useEffect(() => {
  const iconFontLink = document.getElementById('material-icons-font');
  if (!iconFontLink) {
    const link = document.createElement('link');
    link.id = 'material-icons-font';
    link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons+Outlined';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
}, []);
```

## 4. Add Widget Configuration Fetching

Add this useEffect to fetch the widget configuration:

```jsx
// Fetch widget configuration when businessId is available
useEffect(() => {
  if (!businessId || !apiKey) return;
  
  const fetchWidgetConfig = async () => {
    try {
      console.log("Fetching widget configuration for business ID:", businessId);
      const response = await fetch(`${BACKEND_URL}/api/widget-configurations/business/${businessId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-API-KEY": apiKey
        }
      });

      if (!response.ok) {
        console.warn(`Failed to fetch widget configuration: ${response.status}. Using defaults.`);
        setConfigLoadingError(`Could not load custom widget settings (${response.status}). Using defaults.`);
        return;
      }

      const data = await response.json();
      console.log('Fetched widget configuration:', data);
      
      // Merge with defaults to ensure all properties exist
      setWidgetConfig(prevConfig => ({
        ...prevConfig,
        ...data
      }));
    } catch (error) {
      console.error('Error fetching widget configuration:', error);
      setConfigLoadingError(`Failed to load widget settings: ${error.message}. Using defaults.`);
    }
  };

  fetchWidgetConfig();
}, [businessId, apiKey]);
```

## 5. Replace toggleWidget Function

Replace the existing toggleWidget function with:

```jsx
// Handle toggling the widget open/closed
const toggleWidgetWindow = () => {
  // If we're closing the widget and have an active conversation, end it
  if (isWidgetWindowOpen && conversationId && !conversationEnded.current) {
    console.log("🔴 Ending conversation on widget close");
    endConversation();
  }
  
  // Toggle visibility
  setIsWidgetWindowOpen((prev) => !prev);
  
  // If opening the widget and we have a stored conversation ID, try to restore it
  if (!isWidgetWindowOpen) {
    const storedConversationId = Cookies.get('conversation-id');
    if (storedConversationId && !conversationId) {
      console.log("🔄 Restoring conversation from cookie:", storedConversationId);
      setConversationId(storedConversationId);
      conversationCreated.current = true;
    }
  }
};
```

## 6. Define Dynamic Styles

Add these style definitions before the return statement:

```jsx
// Define dynamic styles based on widget configuration
const launcherStyle = {
  backgroundColor: widgetConfig.primaryColor,
  borderRadius: widgetConfig.widgetShape === 'rounded' ? '50%' : '8px',
};

const launcherIconStyle = {
  color: widgetConfig.secondaryColor,
  fontSize: '28px',
};

const widgetWindowStyle = {
  fontFamily: widgetConfig.fontFamily,
  borderRadius: widgetConfig.widgetShape === 'rounded' ? '15px' : '0px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
};

const headerStyle = {
  backgroundColor: widgetConfig.primaryColor,
  color: widgetConfig.secondaryColor,
  borderTopLeftRadius: widgetConfig.widgetShape === 'rounded' ? '15px' : '0px',
  borderTopRightRadius: widgetConfig.widgetShape === 'rounded' ? '15px' : '0px',
};

const welcomeMessageStyle = {
  color: widgetConfig.textColor,
};

const chatInputStyle = {
  borderColor: widgetConfig.primaryColor,
  fontFamily: widgetConfig.fontFamily,
};

const sendButtonStyle = {
  backgroundColor: widgetConfig.primaryColor,
  color: widgetConfig.secondaryColor,
};
```

## 7. Update the JSX Return Statement

Replace the entire return statement with:

```jsx
return (
  <div className={`widget-preview-container ${widgetConfig.widgetPosition}`}>
    {/* The floating button that toggles the chat widget */}
    {!isWidgetWindowOpen && (
      <button
        className="floating-button"
        style={launcherStyle}
        onClick={toggleWidgetWindow}
      >
        <Icon 
          name={widgetConfig.launcherIcon || "chat_bubble"} 
          style={launcherIconStyle} 
        />
      </button>
    )}

    {/* The chat widget UI, only shown when isWidgetWindowOpen is true */}
    {isWidgetWindowOpen && (
      <div className={`chat-widget ${widgetConfig.widgetPosition}`} style={widgetWindowStyle}>
        <div className="widget-header" style={headerStyle}>
          <span>{widgetConfig.headerText}</span>
          <div>
            {isAuthenticated && (
              <button className="logout-button" onClick={handleLogout}>
                Logout
              </button>
            )}
            <button
              className="close-button"
              onClick={toggleWidgetWindow}
              style={{ color: widgetConfig.secondaryColor }}
            >
              <Icon name="close" />
            </button>
          </div>
        </div>

        <div className="widget-body">
          {/* Authentication Section */}
          {!isAuthenticated ? (
            <div className="auth-section">
              {showLogin ? (
                <LoginForm
                  loginEmail={loginEmail}
                  setLoginEmail={setLoginEmail}
                  loginPassword={loginPassword}
                  setLoginPassword={setLoginPassword}
                  handleLogin={handleLogin}
                  authError={authError}
                  switchToSignup={() => setShowLogin(false)}
                />
              ) : (
                <SignupForm
                  signupDetails={signupDetails}
                  setSignupDetails={setSignupDetails}
                  handleSignup={handleSignup}
                  authError={authError}
                  switchToLogin={() => setShowLogin(true)}
                />
              )}
            </div>
          ) : (
            <>
              {/* Show API Key input if businessId is not set yet */}
              {!businessId && (
                <div className="api-key-section">
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    getBusinessIdFromApiKey(apiKey);
                  }} className="api-key-form">
                    <input
                      type="text"
                      placeholder="Enter your API key"
                      value={apiKey}
                      onChange={(e) => {
                        setApiKey(e.target.value);
                        setError(""); // Clear error when typing
                      }}
                      className="api-key-input"
                    />
                    <button 
                      type="submit" 
                      className="api-key-submit"
                      disabled={!apiKey?.trim()}
                    >
                      Verify API Key
                    </button>
                    {error && <div className="error-message">{error}</div>}
                  </form>
                </div>
              )}

              {/* Test Personalization API Button */}
              {businessId && (
                <div className="api-key-section" style={{ margin: '10px 0', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                  <button 
                    onClick={testPersonalizationEndpoint}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: widgetConfig.primaryColor,
                      color: widgetConfig.secondaryColor,
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Test Personalization API
                  </button>
                  <div style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
                    Use this button to test the personalization API directly
                  </div>
                </div>
              )}

              {/* Welcome Message - Only show if configured and no messages yet */}
              {widgetConfig.showWelcomeMessage && 
               widgetConfig.welcomeMessage && 
               messages.length === 0 && (
                <div className="welcome-message" style={welcomeMessageStyle}>
                  <p>{widgetConfig.welcomeMessage}</p>
                </div>
              )}

              {/* Chat Messages */}
              <div className="chat-content">
                {messages.map((msg, index) => {
                  if (msg.sender === "loading") {
                    return (
                      <div key={index}>
                        <LoadingAnimation stage={msg.stage} />
                      </div>
                    );
                  }
                  
                  return (
                    <div
                      key={index}
                      className={`chat-message ${
                        msg.sender === "user"
                          ? "user"
                          : msg.sender === "ai"
                          ? "ai" + (msg.isPersonalized ? " isPersonalized" : "")
                          : "system" + (msg.isMetadata ? " isMetadata" : "")
                      }`}
                    >
                      {msg.isPersonalized && <div className="personalized-badge" style={{fontSize: '0.7em', marginBottom: '4px', color: '#0288d1'}}>✨ Personalized</div>}
                      {msg.text}
                    </div>
                  );
                })}
                {/* Empty div that serves as a reference point for scrolling */}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="widget-footer">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  disabled={!businessId || loading}
                  style={chatInputStyle}
                />
                <button 
                  onClick={handleSend} 
                  disabled={!businessId || loading || !input.trim()}
                  className="send-button"
                  style={sendButtonStyle}
                >
                  <Icon name="send" style={{color: widgetConfig.secondaryColor, fontSize: '20px'}} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )}
  </div>
);
```

## 8. Update Component Initialization

Also update how the Widget is initially launched. Find this in a parent component:

```jsx
// Initialize the widget as visible by default, or based on user preference
useEffect(() => {
  setIsWidgetWindowOpen(true); // or false based on preference
}, []);
```

## 9. Important Note on Variable Names

- Replace all occurrences of `isVisible` with `isWidgetWindowOpen`
- Replace all occurrences of `toggleWidget` with `toggleWidgetWindow`
- Make sure to keep the functionality of `scrollToBottom` and other existing functions

## After Applying Changes

After applying these changes, the widget will:

1. Load the Material Icons font automatically
2. Fetch configuration from `/api/widget-configurations/business/{businessId}` when a business ID is available
3. Apply dynamic styles based on the configuration
4. Maintain all existing functionality (authentication, message handling, conversation tracking, etc.)
5. Present a more modern UI with customizable elements 