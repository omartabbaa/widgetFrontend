import React, { useState, useEffect, useRef } from "react";
import "./widget.css";
import LoginForm from "../components/LoginForm";
import SignupForm from "../components/SignupForm";
import { BACKEND_URL, getAuthHeaders } from '../config';
import { useAuth } from '../context/AuthContext';
import { usePersonalizedAnswer } from '../context/PersonalizedAnswerContext';
import Cookies from 'js-cookie';

const Widget = () => {
  const { isAuthenticated, login, logout } = useAuth();
  const { 
    addPersonalizedAnswer, 
    latestPersonalizedAnswer, 
    isProcessing, 
    setIsProcessing, 
    setPersonalizationError 
  } = usePersonalizedAnswer();
  const [showLogin, setShowLogin] = useState(true);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [businessId, setBusinessId] = useState(null);
  const [apiKey, setApiKey] = useState("6xkaCIxXOdEqUeb55pOR0gTnsHK_1sDq");
  const [error, setError] = useState("");
  const [projects, setProjects] = useState([]);
  const [answerId, setAnswerId] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState("thinking"); // "thinking", "processing", "analyzing"
  
  // Reference for automatic scrolling
  const messagesEndRef = useRef(null);
  
  // Conversation tracking
  const [conversationId, setConversationId] = useState(null);
  const [userId, setUserId] = useState(null);
  const conversationCreated = useRef(false);
  const conversationEnded = useRef(false);

  // State for handling no-answer questions and user details collection
  const [collectingUserInfo, setCollectingUserInfo] = useState(false);
  const [pendingQuestionId, setPendingQuestionId] = useState(null);
  const [pendingQuestion, setPendingQuestion] = useState(null);
  const [userInfoMessageId, setUserInfoMessageId] = useState(null);

  const [signupDetails, setSignupDetails] = useState({
    name: "",
    email: "",
    password: "",
    role: "ROLE_USER",
    businessName: "businessName",
    businessDescription: "businessDescription",
  });

  const [authError, setAuthError] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  // Widget configuration state
  const [widgetConfig, setWidgetConfig] = useState({
    headerText: "AI Chat",
    welcomeMessage: "Welcome to our chat!",
    primaryColor: "#007bff",
    secondaryColor: "#f0f0f0",
    textColor: "#000000",
    fontFamily: "Arial, sans-serif",
    widgetPosition: "bottom-right", // e.g., "bottom-right", "bottom-left"
    launcherIcon: "Chat", // Could be text or an icon class
    widgetShape: "rounded", // e.g., "rounded", "square"
    showWelcomeMessage: true
  });

  // AI Personality state
  const [aiPersonality, setAiPersonality] = useState({
    greetingMessage: null,
    // Potentially other fields like aiName, fallbackResponse if needed later
  });

  // Fetch widget configuration
  useEffect(() => {
    const fetchWidgetConfig = async () => {
      if (!businessId) return;

      try {
        const response = await fetch(`${BACKEND_URL}/api/widget-configurations/business/${businessId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-API-KEY": apiKey
          }
        });

        if (!response.ok) {
          throw new Error("Failed to fetch widget configuration");
        }

        const data = await response.json();
        setWidgetConfig(data);
      } catch (error) {
        console.error("Error fetching widget configuration:", error);
      }
    };

    fetchWidgetConfig();
  }, [businessId, apiKey]);

  // Fetch AI Personality configuration
  useEffect(() => {
    const fetchAiPersonality = async () => {
      if (!businessId || !apiKey) return;

      try {
        const response = await fetch(`${BACKEND_URL}/api/ai-personalities/business/${businessId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-API-KEY": apiKey
          }
        });

        if (!response.ok) {
          // Don't throw an error, just log and proceed without AI personality greeting
          console.warn(`Failed to fetch AI personality: ${response.status}. Welcome message might use default.`);
          return;
        }

        const data = await response.json();
        setAiPersonality(prevPersonality => ({ ...prevPersonality, ...data }));
        console.log("Fetched AI Personality:", data);

      } catch (error) {
        console.error("Error fetching AI personality:", error);
        // Proceed without AI personality greeting
      }
    };

    fetchAiPersonality();
  }, [businessId, apiKey]);

  // Initialize conversation tracking
  useEffect(() => {
    // Check for existing user ID in cookies
    const existingUserId = Cookies.get('user-id');
    if (existingUserId) {
      setUserId(existingUserId); // No need to parse as number since UUIDs are strings
      console.log("😀 Existing user detected, ID:", existingUserId);
    } else {
      // Generate a UUID for anonymous users instead of a random number
      // Use a browser-compatible way to generate UUIDs
      const newUserId = crypto.randomUUID();
      Cookies.set('user-id', newUserId, { expires: 365 }); // Store for 1 year
      setUserId(newUserId);
      console.log("👋 New user detected, assigned UUID:", newUserId);
    }

    // Set up beforeunload event to end the conversation when the user leaves
    const handleBeforeUnload = (event) => {
      if (conversationId && !conversationEnded.current) {
        // Use the synchronous end conversation function
        const success = synchronousEndConversation(conversationId, apiKey);
        if (success) {
          console.log("✅ Conversation ended on page unload");
          conversationEnded.current = true;
        }
      }
      
      // Chrome requires returnValue to be set
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Clean up the event listener
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [conversationId, apiKey]); // Re-run if conversationId or apiKey changes

  // Ensure Material Icons stylesheet is loaded
  useEffect(() => {
    const iconFontLink = document.getElementById('material-icons-font-widget');
    if (!iconFontLink) {
      const link = document.createElement('link');
      link.id = 'material-icons-font-widget';
      link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons+Outlined';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, []);

  // Create a new conversation
  const createConversation = async () => {
    if (!businessId || !userId || conversationCreated.current) {
      console.log("⚠️ Cannot create conversation:", {
        businessId: businessId ? "yes" : "no",
        userId: userId ? "yes" : "no",
        alreadyCreated: conversationCreated.current
      });
      return null;
    }

    // Track retries for error handling
    let retries = 0;
    const maxRetries = 2;
    let lastError = null;

    while (retries <= maxRetries) {
      try {
        // Create request body using the new ConversationCreateDTO structure
        const requestBody = {
          businessId: businessId,
          userId: userId
        };
        
        // Log request details before sending
        console.log("🚀 CONVERSATION CREATE - REQUEST DETAILS:");
        console.log("- Endpoint:", `${BACKEND_URL}/api/conversations/create`);
        console.log("- Method: POST");
        console.log("- Headers:", {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-API-KEY": apiKey?.substring(0, 5) + "..." // Log partial API key for security
        });
        console.log("- Request Body:", JSON.stringify(requestBody, null, 2));
        console.log("- Attempt:", retries + 1, "of", maxRetries + 1);
        
        // Add detailed log of what's being sent
        console.log("📊 CONVERSATION CREATE - FULL PAYLOAD:", {
          endpoint: `${BACKEND_URL}/api/conversations/create`,
          method: "POST",
          requestBody: requestBody,
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-API-KEY": "[REDACTED]"
          }
        });
        
        // Using the exact endpoint structure with updated DTO request body
        const response = await fetch(`${BACKEND_URL}/api/conversations/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-API-KEY": apiKey
          },
          body: JSON.stringify(requestBody)
        });

        console.log("📥 CONVERSATION CREATE - RESPONSE STATUS:", response.status, response.statusText);
        
        if (!response.ok) {
          // Get error details
          let errorDetails = null;
          try {
            const errorText = await response.text();
            console.error("❌ Error details:", errorText);
            try {
              errorDetails = JSON.parse(errorText);
            } catch {
              errorDetails = { error: errorText };
            }
          } catch (e) {
            console.error("❌ Unable to read error details");
          }
          
          // Check if this is a duplicate user error
          const isDuplicateUserError = 
            errorDetails?.error?.includes("duplicate key value") && 
            errorDetails?.error?.includes("user_") && 
            errorDetails?.error?.includes("already exists");
          
          if (isDuplicateUserError && retries < maxRetries) {
            console.log("👀 Detected duplicate user error. Trying with a different userId...");
            
            // Generate a new UUID to avoid the conflict
            const newUserId = crypto.randomUUID();
            console.log("👤 Generated new userId (UUID):", newUserId);
            setUserId(newUserId);
            Cookies.set('user-id', newUserId, { expires: 365 });
            
            // Increment retries and try again
            retries++;
            continue;
          }
          
          // For other errors or if we've exceeded max retries
          lastError = errorDetails?.error || `HTTP error ${response.status}`;
          console.error("❌ Failed to create conversation - Status:", response.status);
          
          // If this is the last attempt, break out of the loop
          if (retries >= maxRetries) {
            console.error("❌ Max retries exceeded. Using fallback approach...");
            break;
          }
          
          // Increment retries and try again
          retries++;
          continue;
        }

        // Parse the response correctly
        const responseText = await response.text();
        console.log("📥 CONVERSATION CREATE - RAW RESPONSE:", responseText);
        
        let data;
        
        try {
          data = JSON.parse(responseText);
          console.log("📥 CONVERSATION CREATE - PARSED RESPONSE:", JSON.stringify(data, null, 2));
        } catch (e) {
          console.error("❌ Failed to parse conversation response:", e, "Raw response:", responseText);
          return null;
        }
        
        // Extract conversation ID handling both camelCase and snake_case formats
        const conversationId = data.conversationId || data.conversation_id;
        
        if (data && conversationId) {
          console.log("✅ CONVERSATION CREATE - SUCCESS! Conversation created with ID:", conversationId);
          console.log("✅ CONVERSATION CREATE - Full response data:", {
            conversationId: conversationId,
            businessId: data.businessId || data.business_id,
            userId: data.userId,
            startTime: data.startTime
          });
          
          // Store as string since it's a UUID
          setConversationId(conversationId);
          conversationCreated.current = true;
          
          // Store in cookie for 1 day
          Cookies.set('conversation-id', conversationId, { expires: 1 });
          
          // Create a HandoffState for this conversation
          try {
            console.log("🔄 Creating HandoffState for conversation:", conversationId);
            
            // Prepare HandoffState with all boolean flags set to false
            const handoffStateDTO = {
              conversationId: conversationId,
              userId: data.userId,
              hasName: false,
              hasEmail: false,
              hasQuestionSummary: false,
              isConfirmed: false,
              isTicketCreated: false,
              currentStep: 0
            };
            
            console.log("📤 HANDOFF STATE CREATE - REQUEST DETAILS:");
            console.log("- Endpoint:", `${BACKEND_URL}/api/handoff-states`);
            console.log("- Method: POST");
            console.log("- Request Body:", JSON.stringify(handoffStateDTO, null, 2));
            
            // Add detailed log of the handoff state creation
            console.log("📊 HANDOFF STATE CREATE - FULL PAYLOAD:", {
              endpoint: `${BACKEND_URL}/api/handoff-states`,
              method: "POST",
              requestBody: handoffStateDTO,
              headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "X-API-KEY": "[REDACTED]"
              }
            });
            
            // Create the HandoffState
            fetch(`${BACKEND_URL}/api/handoff-states`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "X-API-KEY": apiKey
              },
              body: JSON.stringify(handoffStateDTO)
            })
            .then(response => {
              console.log("📥 HANDOFF STATE CREATE - RESPONSE STATUS:", response.status, response.statusText);
              
              if (!response.ok) {
                console.warn("⚠️ Failed to create HandoffState:", response.status);
                response.text().then(text => {
                  console.warn("⚠️ HandoffState error details:", text);
                }).catch(() => {});
                return;
              }
              
              response.text().then(text => {
                try {
                  const handoffData = JSON.parse(text);
                  console.log("✅ HANDOFF STATE CREATE - SUCCESS! HandoffState created:", handoffData);
                } catch (e) {
                  console.log("📥 HANDOFF STATE CREATE - Raw response:", text);
                }
              }).catch(e => {
                console.warn("⚠️ Could not read HandoffState response:", e);
              });
            })
            .catch(error => {
              console.error("❌ HANDOFF STATE CREATE - ERROR:", error);
              // Don't block conversation creation if handoff state fails
            });
          } catch (handoffError) {
            // Log error but don't block conversation creation
            console.error("❌ Error creating HandoffState:", handoffError);
          }
          
          return conversationId;
        } else {
          console.error("❌ CONVERSATION CREATE - FAILED! No ID in response:", data);
          return null;
        }
      } catch (error) {
        console.error("❌ CONVERSATION CREATE - ERROR:", error);
        console.error("❌ CONVERSATION CREATE - Error stack:", error.stack);
        
        // Store the error and try again if we haven't exceeded max retries
        lastError = error.message;
        if (retries < maxRetries) {
          console.log(` Retrying... (${retries + 1}/${maxRetries})`);
          retries++;
          continue;
        }
        break;
      }
    }
    
    // If we've exhausted all retries, create a "fake" conversation ID as fallback
    // This allows the chat to continue working even if conversation tracking fails
    if (retries > maxRetries) {
      console.log("⚠️ FALLBACK: Creating temporary conversation ID after multiple failures");
      const fallbackConversationId = `fallback-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      setConversationId(fallbackConversationId);
      conversationCreated.current = true;
      console.log("⚠️ Using fallback conversation ID:", fallbackConversationId);
      console.log("⚠️ Some conversation tracking features may be limited");
      
      // Do not store fallback IDs in cookies
      return fallbackConversationId;
    }
    
    return null;
  };

  // End the conversation
  const endConversation = async () => {
    if (!conversationId || conversationEnded.current) {
      console.log("⚠️ Cannot end conversation:", {
        conversationId: conversationId ? "yes" : "no",
        alreadyEnded: conversationEnded.current
      });
      return;
    }

    try {
      console.log("👋 Ending conversation with ID:", conversationId);
      
      // Create the ConversationUpdateDTO with endConversation set to true
      const updateDTO = {
        endConversation: true,
        calculateSatisfactionScore: true // Calculate satisfaction score when ending
      };
      
      console.log("📤 CONVERSATION END - REQUEST DETAILS:");
      console.log("- Endpoint:", `${BACKEND_URL}/api/conversations/${conversationId}`);
      console.log("- Method: PUT");
      console.log("- Request Body:", JSON.stringify(updateDTO, null, 2));
      
      // Add detailed log of what's being sent to the API
      console.log("📊 CONVERSATION END - FULL PAYLOAD:", {
        endpoint: `${BACKEND_URL}/api/conversations/${conversationId}`,
        method: "PUT",
        conversationId: conversationId,
        updateDTO: updateDTO,
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-API-KEY": "[REDACTED]"
        }
      });
      
      // Now using PUT endpoint with ConversationUpdateDTO for ending the conversation
      const response = await fetch(`${BACKEND_URL}/api/conversations/${conversationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-API-KEY": apiKey
        },
        body: JSON.stringify(updateDTO)
      });

      console.log("📥 CONVERSATION END - RESPONSE STATUS:", response.status, response.statusText);

      if (response.ok) {
        // Parse the response
        const responseText = await response.text();
        console.log("📥 CONVERSATION END - RAW RESPONSE:", responseText);
        
        try {
          const data = JSON.parse(responseText);
          console.log("📥 CONVERSATION END - PARSED RESPONSE:", JSON.stringify(data, null, 2));
        } catch (e) {
          // Response might not be JSON
          console.log("📥 CONVERSATION END - Non-JSON response received");
        }
        
        console.log("✅ Conversation ended successfully");
        conversationEnded.current = true;
        Cookies.remove('conversation-id');
      } else {
        console.error("❌ Failed to end conversation - Status:", response.status);
        
        // Try to get more details about the error
        try {
          const errorText = await response.text();
          console.error("Error details:", errorText);
        } catch (e) {
          // Ignore error reading error
        }
      }
    } catch (error) {
      console.error("❌ Error ending conversation:", error);
      console.error("❌ Error stack:", error.stack);
    }
  };

  // Handle beforeunload for ending the conversation (synchronous version)
  const synchronousEndConversation = (conversationId, apiKey) => {
    if (!conversationId) return false;
    
    try {
      // Create the ConversationUpdateDTO with endConversation set to true
      const updateDTO = {
        endConversation: true,
        calculateSatisfactionScore: true // Calculate satisfaction score when ending
      };
      
      // Use synchronous XMLHttpRequest for beforeunload event
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', `${BACKEND_URL}/api/conversations/${conversationId}`, false); // synchronous request
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.setRequestHeader('X-API-KEY', apiKey);
      xhr.send(JSON.stringify(updateDTO));
      
      return xhr.status >= 200 && xhr.status < 300;
    } catch (e) {
      console.error("❌ Failed to end conversation on unload:", e);
      return false;
    }
  };

  // Update the trackMessage function to use only valid message types
  const trackMessage = async (message, messageType, questionId = null, currentConversationId = null) => {
    // Use the provided conversationId parameter if available, otherwise use the state value
    const conversationToUse = currentConversationId || conversationId;

    if (!conversationToUse) {
      console.log("⚠️ Cannot track message - no active conversation");
      return;
    }

    try {
      console.log(`📝 MESSAGE TRACK - Tracking ${messageType} message in conversation ${conversationToUse}`);
      
      // Map system error messages to a valid message type
      const validMessageType = messageType === "SYSTEM_ERROR" ? "AI" : messageType;
      
      // Create ConversationUpdateDTO for the conversation update endpoint
      const conversationUpdateDTO = {
        newMessage: {
          message: message,
          messageType: validMessageType,
          questionId: questionId,
          timestamp: new Date().toISOString()
        },
        endConversation: false
      };
      
      // Log details for the request
      console.log("📝 MESSAGE TRACK - REQUEST DETAILS:");
      console.log(`- Endpoint: ${BACKEND_URL}/api/conversations/${conversationToUse}`);
      console.log("- Method: PUT");
      console.log(`- Message Type: ${validMessageType}`);
      console.log(`- Question ID: ${questionId}`);
      
      // Update the conversation with the PUT endpoint
      const response = await fetch(`${BACKEND_URL}/api/conversations/${conversationToUse}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-API-KEY": apiKey
        },
        body: JSON.stringify(conversationUpdateDTO)
      });
      
      // Handle response
      if (!response.ok) {
        console.error(`❌ MESSAGE TRACK - Failed to track message. Status: ${response.status}`);
        try {
          const errorText = await response.text();
          console.error("❌ Error details:", errorText);
        } catch (e) {
          console.error("❌ Unable to read error details:", e);
        }
      } else {
        console.log(`✅ MESSAGE TRACK - Message tracked successfully - Type: ${validMessageType} QuestionID: ${questionId || 'N/A'}`);
        try {
          const responseText = await response.text();
          console.log("📥 Response:", responseText);
        } catch (e) {
          console.error("❌ Unable to read response:", e);
        }
      }
    } catch (error) {
      console.error("❌ Error tracking message:", error);
      console.error("❌ Error stack:", error.stack);
    }
  };

  // 1) Fetch projects for a given business ID
  const fetchProjects = async (bizId) => {
    if (!bizId) {
      setError("Business ID is required to fetch projects");
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/projects/business/${bizId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-API-KEY": apiKey
        },
        credentials: "include"
      });

      let data;
      try {
        const textResponse = await response.text();
        console.log("Raw projects response:", textResponse);
        
        if (!textResponse) {
          throw new Error("Empty response from server");
        }
        
        data = JSON.parse(textResponse);
        console.log("Projects fetch response:", data);
      } catch (jsonError) {
        console.error("Failed to parse JSON response:", jsonError);
        throw new Error("Invalid response from server");
      }

      if (response.ok && Array.isArray(data)) {
        setProjects(data);
        setError("");
        console.log("Successfully fetched projects:", data.length);
        return;
      }

      // Handle error responses
      const errorMessage = data.message || (() => {
        switch (response.status) {
          case 400: return "Invalid business ID format";
          case 403: return "Unauthorized to access projects";
          case 404: return "No projects found for this business";
          case 500: return "Server error while fetching projects";
          default: return "Failed to fetch projects";
        }
      })();

      setError(errorMessage);
      setProjects([]);
      
      console.error("Projects fetch failed:", {
        status: response.status,
        responseData: data,
        statusText: response.statusText
      });
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError(err.message || "Failed to connect to the server. Please check your connection and try again.");
      setProjects([]);
    }
  };

  // 2) Get business ID from API key, then fetch projects
  const getBusinessIdFromApiKey = async () => {
    if (!apiKey) {
      console.log("API key is required to fetch business ID");
      setError("API key is required to fetch business ID");
      return;
    }

    // Show loading in the API key section
    setLoading(true);
    setLoadingStage("processing");
    
    // Add a loading message to the chat
    const verifyLoadingId = Date.now();
    setMessages((prev) => [
      ...prev,
      {
        id: verifyLoadingId,
        sender: "loading",
        isLoading: true,
        stage: "verifying"
      }
    ]);

    try {
      console.log("Fetching business ID from API key:", apiKey);
      const response = await fetch(`${BACKEND_URL}/api/admin/api-keys/business-id/${apiKey}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-API-Key": apiKey
        }
      });

      let data;
      try {
        const textResponse = await response.text();
        console.log("Raw response:", textResponse);
        
        if (!textResponse) {
          throw new Error("Empty response from server");
        }
        
        data = JSON.parse(textResponse);
        console.log("API Key verification response:", data);
      } catch (jsonError) {
        console.error("Failed to parse JSON response:", jsonError);
        throw new Error("Invalid response from server");
      }

      // Remove loading message
      setLoading(false);
      setMessages((prev) => prev.filter(msg => !msg.isLoading || msg.id !== verifyLoadingId));

      if (response.ok && data.status === "success") {
        setBusinessId(data.businessId);
        setError("");
        console.log("Successfully verified API key. Business ID:", data.businessId);
        
        // Add success message
        setMessages((prev) => [
          ...prev,
          {
            text: `API Key verified successfully! Connected to business ID: ${data.businessId}`,
            sender: "system"
          }
        ]);
        
        await fetchProjects(data.businessId);
        return;
      }

      // Handle error responses
      const errorMessage = data.message || (() => {
        switch (response.status) {
          case 400: return "Invalid API key format";
          case 403: return "API key is inactive or unauthorized";
          case 404: return "API key not found";
          case 500: return "Server error. Please try again later";
          default: return "Failed to verify API key";
        }
      })();

      setError(errorMessage);
      setBusinessId(null);
      
      // Add error message to chat
      setMessages((prev) => [
        ...prev,
        {
          text: `API Key verification failed: ${errorMessage}`,
          sender: "system"
        }
      ]);
      
      console.error("API Key verification failed:", {
        status: response.status,
        responseData: data,
        statusText: response.statusText
      });
    } catch (err) {
      console.error("Error verifying API key:", err);
      
      // Remove loading message
      setLoading(false);
      setMessages((prev) => prev.filter(msg => !msg.isLoading || msg.id !== verifyLoadingId));
      
      // If server is unreachable, use fallback business ID for testing
      if (err.message === "Failed to fetch") {
        console.warn("Server connection failed - using fallback business ID for testing");
        setBusinessId(17); // Use default business ID
        setError("Warning: Using demo mode (server unreachable). Limited functionality available.");
        
        // Add fallback message
        setMessages((prev) => [
          ...prev,
          {
            text: "Server connection failed. Using demo mode with limited functionality.",
            sender: "system"
          }
        ]);
        
        return;
      }
      
      setError(err.message || "Failed to connect to the server. Please check your connection and try again.");
      setBusinessId(null);
      
      // Add error message to chat
      setMessages((prev) => [
        ...prev,
        {
          text: `API Key verification error: ${err.message || "Connection failed"}`,
          sender: "system"
        }
      ]);
    }
  };

  // 4) Handle toggling the widget open/closed
  const toggleWidget = () => {
    // If we're closing the widget and have an active conversation, end it
    if (isVisible && conversationId && !conversationEnded.current) {
      console.log("🔴 Ending conversation on widget close");
      endConversation();
    }
    
    // Toggle visibility
    setIsVisible((prev) => !prev);
    
    // If opening the widget and we have a stored conversation ID, try to restore it
    if (!isVisible) {
      const storedConversationId = Cookies.get('conversation-id');
      if (storedConversationId && !conversationId) {
        console.log("🔄 Restoring conversation from cookie:", storedConversationId);
        setConversationId(storedConversationId);
        conversationCreated.current = true;
      }
    }
  };

  // 5) Handle logging out: remove JWT and API key from localStorage
  const handleLogout = () => {
    // End the conversation before logout
    if (conversationId && !conversationEnded.current) {
      console.log("🔴 Ending conversation on logout");
      endConversation();
    }
    
    logout();
    setMessages([]);
    setInput("");
    setApiKey("");
    setBusinessId(null);
    setProjects([]);
    
    // Clear conversation tracking
    setConversationId(null);
    conversationCreated.current = false;
    conversationEnded.current = false;
  };

  // 6) Handle login form
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BACKEND_URL}/authenticate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginEmail, password: loginPassword }),
      });

      if (!response.ok) {
        const message = await response.text();
        setAuthError(message || "Login failed");
        return;
      }

      const data = await response.json();
      login(data.jwt);
      setAuthError("");
    } catch (err) {
      setAuthError("Error during login. Ensure the backend server is running.");
      console.error(err);
    }
  };

  // 7) Handle signup form
  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        user: {
          name: signupDetails.name,
          email: signupDetails.email,
          password: signupDetails.password,
          role: signupDetails.role,
        },
        business: {
          name: signupDetails.businessName,
          description: signupDetails.businessDescription,
        },
      };

      const response = await fetch(`${BACKEND_URL}/api/users/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = await response.text();
        setAuthError(message || "Signup failed");
        return;
      }

      setAuthError("");
      alert("Signup successful! Please log in.");
      setShowLogin(true);
    } catch (err) {
      setAuthError("An error occurred during signup. Ensure the backend is running.");
      console.error(err);
    }
  };

  // This function calls the AI personalization endpoint
  const getPersonalizedAnswer = async (originalQuestion, responseData) => {
    console.log("🔍 [PERSONALIZATION STARTED] Starting personalization process...");
    console.log("📝 [PERSONALIZATION] Original question:", originalQuestion);
    console.log("📊 [PERSONALIZATION] Response data:", JSON.stringify(responseData, null, 2));
    
    setIsProcessing(true);
    
    try {
      // Don't proceed if we don't have the necessary data
      if (!responseData) {
        console.warn("❌ [PERSONALIZATION] Missing responseData for personalization");
        setIsProcessing(false);
        return null;
      }
      
      if (!originalQuestion) {
        console.warn("❌ [PERSONALIZATION] Missing originalQuestion for personalization");
        setIsProcessing(false);
        return null;
      }

      // Extract data from the response - now working with a potentially modified structure
      const similarQuestion = responseData.questionText || "";
      const questionTitle = responseData.questionTitle || "";
      const answerFromDB = responseData.answer?.answerText || "";
      const questionId = responseData.questionId || null;
      
      console.log(`🔍 [PERSONALIZATION] Extracted data:
        - similarQuestion: ${similarQuestion}
        - questionTitle: ${questionTitle}
        - answerFromDB length: ${answerFromDB.length}
        - questionId: ${questionId}
        - businessId: ${businessId}
      `);
      
      // Ensure we have an answer to personalize
      if (!answerFromDB || answerFromDB.trim().length === 0) {
        console.warn("❌ [PERSONALIZATION] No answer text available for personalization");
        setIsProcessing(false);
        return null;
      }
      
      // Format the similar question to include title if available
      const formattedSimilarQuestion = questionTitle 
        ? `${questionTitle}: ${similarQuestion}`
        : similarQuestion;
      
      // Create rich context for the personalization
      const contextInformation = `
        The user is asking a question.
        Your task is to personalize the provided answer to sound more conversational and helpful.
        Make the answer more engaging and tailored to the specific question: "${originalQuestion}".
      `.trim().replace(/\n\s+/g, ' ');
      
      // Create the request payload according to AIAnswerInputDTO
      const payload = {
        askedQuestion: originalQuestion,
        similarQuestionFromDB: formattedSimilarQuestion,
        answerFromDB: answerFromDB,
        context: contextInformation,
        questionId: questionId ? Number(questionId) : null,
        businessId: businessId ? Number(businessId) : null
      };

      console.log("🧠 [PERSONALIZATION] Requesting AI personalization with payload:", JSON.stringify(payload, null, 2));
      console.log(`🔗 [PERSONALIZATION] Sending request to: ${BACKEND_URL}/api/ai-answers/personalize`);

      // Make the personalization request
      const response = await fetch(`${BACKEND_URL}/api/ai-answers/personalize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("jwt")}`,
          "X-API-KEY": apiKey,
          "Origin": window.location.origin
        },
        body: JSON.stringify(payload),
        credentials: "include",
        mode: "cors"
      });

      console.log(`🔍 [PERSONALIZATION] Response status: ${response.status} ${response.statusText}`);

      // Log response headers for debugging
      const responseHeaders = {};
      response.headers.forEach((value, name) => {
        responseHeaders[name] = value;
      });
      console.log("🔍 [PERSONALIZATION] Response headers:", responseHeaders);

      // Log the raw response for debugging
      const responseText = await response.text();
      console.log("📡 [PERSONALIZATION] Raw personalization response:", responseText);
      
      if (!response.ok) {
        console.error("❌ [PERSONALIZATION] AI personalization error:", {
          status: response.status,
          statusText: response.statusText,
          body: responseText
        });
        setIsProcessing(false);
        return null;
      }

      // Parse the response if it's valid JSON
      let personalizedData;
      try {
        personalizedData = JSON.parse(responseText);
      } catch (e) {
        console.error("❌ [PERSONALIZATION] Failed to parse personalization response:", e);
        console.error("❌ [PERSONALIZATION] Raw response that failed to parse:", responseText);
        setIsProcessing(false);
        return null;
      }
      
      console.log("✨ [PERSONALIZATION] AI personalized answer:", personalizedData);
      
      // Verify that we have a personalized answer
      if (!personalizedData.personalizedAnswer || personalizedData.personalizedAnswer.trim().length === 0) {
        console.warn("❌ [PERSONALIZATION] Received empty personalized answer");
        setIsProcessing(false);
        return null;
      }
      
      // Store the personalized answer in context
      if (personalizedData) {
        console.log("💾 [PERSONALIZATION] Storing personalized answer in context");
        addPersonalizedAnswer(personalizedData);
      }
      
      setIsProcessing(false);
      return personalizedData;
    } catch (error) {
      console.error("❌ [PERSONALIZATION] Error during answer personalization:", error);
      console.error("❌ [PERSONALIZATION] Error stack:", error.stack);
      setPersonalizationError(error.message || "Failed to personalize answer");
      setIsProcessing(false);
      return null;
    }
  };

  // Function to handle questions with no answers
  const handleNoAnswerQuestion = async (questionData, originalQuestion) => {
    console.log("📝 [NO_ANSWER] Processing question with no answer:", questionData);
    
    // Extract the question ID
    const questionId = questionData.questionId || "unknown";
    
    // Create a standard response for questions with no answer
    const noAnswerResponse = "I don't have an answer to this question in our database yet. " +
      "If you'd like to receive an answer when it's available, please provide your name and email address.";
    
    // Display the message
    setMessages((prev) => [
      ...prev,
      { 
        text: noAnswerResponse, 
        sender: "ai",
        isNoAnswer: true
      }
    ]);
    
    // Store a unique ID for this message so we can reference it later
    const messageId = Date.now();
    setUserInfoMessageId(messageId);
    
    // Track the AI response
    if (conversationId) {
      trackMessage(noAnswerResponse, "AI", questionId, conversationId);
    }
    
    // Set state to indicate we're collecting user info
    setCollectingUserInfo(true);
    setPendingQuestionId(questionId);
    setPendingQuestion(originalQuestion);
    
    // Make a request to the user details endpoint to inform the backend
    try {
      const userDetailsRequest = {
        userId: userId,
        conversationId: conversationId,
        originalQuestion: originalQuestion
      };
      
      console.log("📤 [NO_ANSWER] Requesting user details:", userDetailsRequest);
      
      const response = await fetch(`${BACKEND_URL}/api/user-details/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-API-KEY": apiKey
        },
        body: JSON.stringify(userDetailsRequest)
      });
      
      if (!response.ok) {
        console.error(`❌ [NO_ANSWER] Request failed: ${response.status}`);
        // Continue with collecting user info even if this fails
      } else {
        const data = await response.json();
        console.log("✅ [NO_ANSWER] Request succeeded:", data);
        
        // If the response includes an answer, update our message
        if (data && data.answer) {
          // Update the no-answer message with the response
          setMessages((prev) => 
            prev.map(msg => 
              msg.isNoAnswer ? { ...msg, text: data.answer } : msg
            )
          );
          
          // Track the updated message
          if (conversationId) {
            trackMessage(data.answer, "AI", questionId, conversationId);
          }
        }
      }
    } catch (error) {
      console.error("❌ [NO_ANSWER] Error requesting user details:", error);
      // Continue with collecting user info even if this fails
    }
    
    return true;
  };
  
  // Function to parse user input for name and email
  const parseUserInfo = (input) => {
    // Basic regex for email extraction
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const email = input.match(emailRegex)?.[0] || null;
    
    // If no email found, return null
    if (!email) return null;
    
    // Try to extract name
    // Remove the email from the input to help with name extraction
    const inputWithoutEmail = input.replace(email, "").trim();
    
    // Look for patterns like "my name is X" or "I'm X"
    let name = null;
    const namePatterns = [
      /my name is ([A-Za-z\s]+?)(?:\s+and\s+my\s+email\s+is|\s+email\s+is|\s+and\s+email:|\s*,)/i,
      /my name is ([A-Za-z\s]+)/i,
      /i am ([A-Za-z\s]+?)(?:\s+and\s+my\s+email\s+is|\s+email\s+is|\s+and\s+email:|\s*,)/i,
      /i am ([A-Za-z\s]+)/i,
      /i'm ([A-Za-z\s]+?)(?:\s+and\s+my\s+email\s+is|\s+email\s+is|\s+and\s+email:|\s*,)/i,
      /i'm ([A-Za-z\s]+)/i,
      /name:?\s*([A-Za-z\s]+?)(?:\s+and\s+my\s+email\s+is|\s+email\s+is|\s+and\s+email:|\s*,)/i,
      /name:?\s*([A-Za-z\s]+)/i,
    ];
    
    for (const pattern of namePatterns) {
      const match = inputWithoutEmail.match(pattern);
      if (match && match[1]) {
        name = match[1].trim();
        console.log(`📝 Name matched with pattern: ${pattern}`);
        console.log(`📝 Extracted name: "${name}"`);
        break;
      }
    }
    
    // If no name pattern matched but there's text other than the email,
    // try a simple approach: look for standalone words before "and my email" or similar
    if (!name && inputWithoutEmail.length > 0) {
      // Look for the phrase "and my email is" or similar
      const emailPhrases = [
        "and my email is",
        "and my email",
        "email is",
        "email:",
        "and email is",
        "and email:"
      ];
      
      for (const phrase of emailPhrases) {
        if (inputWithoutEmail.toLowerCase().includes(phrase)) {
          // Take text before this phrase
          const beforePhrase = inputWithoutEmail.toLowerCase().split(phrase)[0].trim();
          
          // Look for "my name is" or similar in this text
          const nameIntros = ["my name is ", "i am ", "i'm ", "name: "];
          for (const intro of nameIntros) {
            if (beforePhrase.includes(intro)) {
              name = beforePhrase.split(intro)[1].trim();
              console.log(`📝 Name extracted with intro "${intro}": "${name}"`);
              break;
            }
          }
          
          // If we still don't have a name, just use the text before the email phrase
          if (!name) {
            name = beforePhrase;
            console.log(`📝 Using text before email phrase: "${name}"`);
          }
          
          break;
        }
      }
      
      // If still no name, fall back to simple word extraction
      if (!name) {
        // Split by common separators
        const parts = inputWithoutEmail.split(/[,;:\n\r]+/).map(part => part.trim()).filter(Boolean);
        if (parts.length > 0) {
          // Take the first part, but only the first word if it contains multiple words
          const firstPart = parts[0].trim();
          const words = firstPart.split(/\s+/);
          name = words[0]; // Just take the first word as the name
          console.log(`📝 Falling back to first word: "${name}"`);
        }
      }
    }
    
    // If still no name, use a generic placeholder
    if (!name) {
      name = "User";
      console.log(`📝 No name found, using default: "${name}"`);
    }
    
    console.log(`📝 FINAL EXTRACTED INFO - Name: "${name}", Email: "${email}"`);
    return { name, email };
  };
  
  // Function to submit user details
  const submitUserDetails = async (name, email) => {
    if (!userId || !pendingQuestionId) {
      console.error("❌ [USER_DETAILS] Missing userId or pendingQuestionId for user details submission");
      return false;
    }
    
    try {
      const url = `${BACKEND_URL}/api/user-details/update/${userId}?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`;
      
      console.log("📤 [USER_DETAILS] Submitting user details:");
      console.log(`- Name: ${name}`);
      console.log(`- Email: ${email}`);
      console.log(`- URL: ${url}`);
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-API-KEY": apiKey
        }
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }
      
      console.log("✅ [USER_DETAILS] User details submitted successfully");
      
      // Add confirmation message
      setMessages((prev) => [
        ...prev,
        { 
          text: `Thank you, ${name}. We've received your contact information and will send the answer to ${email} when it's available.`, 
          sender: "ai"
        }
      ]);
      
      // Track the confirmation message
      if (conversationId) {
        trackMessage(
          `Thank you, ${name}. We've received your contact information and will send the answer to ${email} when it's available.`,
          "AI",
          pendingQuestionId,
          conversationId
        );
      }
      
      // Reset the collection state
      setCollectingUserInfo(false);
      setPendingQuestionId(null);
      setPendingQuestion(null);
      
      return true;
    } catch (error) {
      console.error("❌ [USER_DETAILS] Error submitting user details:", error);
      
      // Add error message
      setMessages((prev) => [
        ...prev,
        { 
          text: "I'm sorry, there was an error processing your contact information. Please try again later.", 
          sender: "system"
        }
      ]);
      
      return false;
    }
  };

  // Modified handleSend function to track conversations and messages
  const handleSend = async () => {
    if (input.trim() === "") return;

    // Store the original question for later personalization
    const originalQuestion = input.trim();
    
    // Check if we're in user info collection mode
    if (collectingUserInfo) {
      // Add user message to display
      setMessages((prev) => [...prev, { text: originalQuestion, sender: "user" }]);
      setInput("");
      
      // Track user message
      if (conversationId) {
        trackMessage(originalQuestion, "USER", null, conversationId);
      }
      
      // Use the parseUserInfo function instead of simple email extraction
      const userInfo = parseUserInfo(originalQuestion);
      
      if (userInfo && userInfo.email) {
        // We have both name and email from the parseUserInfo function
        const { name, email } = userInfo;
        
        // Submit the user details
        try {
          const url = `${BACKEND_URL}/api/user-details/update/${userId}?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`;
          
          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
              "X-API-KEY": apiKey
            }
          });
          
          if (response.ok) {
            // Add confirmation message
            setMessages((prev) => [
              ...prev,
              { 
                text: `Thank you, ${name}. We've received your contact information and will send the answer to ${email} when it's available.`, 
                sender: "ai"
              }
            ]);
            
            // Reset collection mode
            setCollectingUserInfo(false);
            setPendingQuestionId(null);
            setPendingQuestion(null);
          } else {
            throw new Error("Failed to update user details");
          }
        } catch (error) {
          console.error("Error submitting user details:", error);
          setMessages((prev) => [
            ...prev,
            { 
              text: "I'm sorry, there was an error processing your contact information. Please try again later.", 
              sender: "system"
            }
          ]);
        }
      } else {
        // If we couldn't find an email, ask for it explicitly
        setMessages((prev) => [
          ...prev,
          { 
            text: "I couldn't identify your email address. Please provide your name and email in the format: 'My name is [name] and my email is [email@example.com]'", 
            sender: "ai"
          }
        ]);
      }
      
      return;
    }
    
    // Create local variable to hold conversationId (either existing or new)
    let currentConversationId = conversationId;

    // Create conversation if this is the first message and no active conversation exists
    if (!currentConversationId && !conversationCreated.current) {
      console.log("⏳ CHAT - Creating conversation before sending first message");
      const newConversationId = await createConversation();
      if (newConversationId) {
        console.log("✅ CHAT - Conversation created successfully, ID:", newConversationId);
        console.log("✅ CHAT - Will now use this conversation ID for tracking messages");
        setConversationId(newConversationId);
        // Use the new conversation ID immediately
        currentConversationId = newConversationId;
      } else {
        console.warn("⚠️ CHAT - Failed to create conversation - proceeding without tracking");
      }
    }

    // Add user message to display
    setMessages((prev) => [...prev, { text: originalQuestion, sender: "user" }]);
    setInput("");
    
    // Track user message using our local currentConversationId variable
    if (currentConversationId) {
      console.log("📝 CHAT - Tracking USER message in conversation:", currentConversationId);
      console.log("📝 CHAT - User message:", originalQuestion);
      // Pass the current conversation ID to trackMessage
      trackMessage(originalQuestion, "USER", null, currentConversationId);
    } else {
      console.log("⚠️ CHAT - Not tracking user message - no active conversation");
    }
    
    // Show cool loading animation
    setLoading(true);
    
    // Create a unique ID for the loading message
    const loadingId = Date.now();
    
    // Add the loading message
    setMessages((prev) => [
      ...prev,
      { 
        id: loadingId,
        sender: "loading",
        isLoading: true,
        stage: "thinking" // Start with thinking stage
      }
    ]);
    
    // Change loading stages at intervals to make it more interesting
    const loadingIntervals = [];
    loadingIntervals.push(
      setTimeout(() => {
        setLoadingStage("processing");
        // Update the loading message stage
        setMessages((prev) => 
          prev.map(msg => 
            msg.id === loadingId 
              ? { ...msg, stage: "processing" } 
              : msg
          )
        );
      }, 2000)
    );
    
    loadingIntervals.push(
      setTimeout(() => {
        setLoadingStage("analyzing");
        // Update the loading message stage
        setMessages((prev) => 
          prev.map(msg => 
            msg.id === loadingId 
              ? { ...msg, stage: "analyzing" } 
              : msg
          )
        );
      }, 4000)
    );

    console.log("🚀 Sending message...");
    console.log("🔑 API Key:", apiKey);
    console.log("🏢 Business ID:", businessId);
    console.log("📦 Request Body:", {
      questionTitle: "User Question",
      questionText: originalQuestion,
      businessId: businessId,
      userId: userId
    });

    try {
      // Check if we have a valid conversation ID
      if (!currentConversationId) {
        throw new Error("Conversation ID is required. Please create a conversation first.");
      }
      
      // Updated to use the new endpoint with the API key as a query parameter
      // While still keeping the API key in the header for backward compatibility
      const response = await fetch(`${BACKEND_URL}/api/widget/submitQuestion?apiKey=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("jwt")}`,
          "X-API-KEY": apiKey, // Keep header for backward compatibility
        },
        body: JSON.stringify({
          questionTitle: "User Question",
          questionText: originalQuestion,
          businessId: businessId,
          userId: userId,
          conversationId: currentConversationId // Include the conversationId in the API request
        }),
      });

      console.log("📤 WIDGET API - REQUEST DETAILS:");
      console.log("- Endpoint:", `${BACKEND_URL}/api/widget/submitQuestion?apiKey=${apiKey}`);
      console.log("- Method: POST");
      console.log("- Request Body:", {
        questionTitle: "User Question",
        questionText: originalQuestion?.substring(0, 100) + (originalQuestion?.length > 100 ? "..." : ""),
        businessId: businessId,
        userId: userId
      });
      
      // Add detailed log of what's being sent
      console.log("📊 WIDGET API - FULL PAYLOAD:", {
        endpoint: `${BACKEND_URL}/api/widget/submitQuestion?apiKey=${apiKey}`,
        method: "POST",
        requestBody: {
          questionTitle: "User Question",
          questionText: originalQuestion,
          businessId: businessId,
          userId: userId
        },
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("jwt") ? "[REDACTED]" : ""}`,
          "X-API-KEY": "[REDACTED]"
        }
      });

      if (!response.ok) {
        // Remove the loading animation if there's an error
        setLoading(false);
        setMessages((prev) => prev.filter(msg => !msg.isLoading || msg.id !== loadingId));
        
        // Clear the loading stage intervals
        loadingIntervals.forEach(clearTimeout);
        
        const errorResponse = await response.json();
        console.error("❌ Backend Error Response:", errorResponse);
        throw new Error(errorResponse.error || "Backend responded with an error");
      }

      // Get the response data
      const responseText = await response.text();
      console.log("📡 Raw server response:", responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("❌ Failed to parse server response:", e);
        throw new Error("Invalid response format from server");
      }
      
      console.log("✅ Parsed server response:", data);
      
      // First extract info from the backend response, but don't display it yet
      if (data) {
        let answerText = null;
        let answerObject = null;
        let questionId = data.questionId || null;
        
        // Check if we have a direct answer object
        if (data.answer && data.answer.answerText) {
          answerText = data.answer.answerText;
          answerObject = data.answer;
        } 
        // Check if we have an answers array
        else if (data.answers && data.answers.length > 0 && data.answers[0].answerText) {
          answerText = data.answers[0].answerText;
          answerObject = data.answers[0];
        }
        // Check if we have a personalizationVerification with preview
        else if (data.personalizationVerification && data.personalizationVerification.sampleAnswerPreview) {
          answerText = data.personalizationVerification.sampleAnswerPreview;
        }
        
        // If we found an answer text, track it but don't display it yet
        if (answerText) {
          // Only track the original AI response server-side, don't display it
          if (currentConversationId) {
            console.log("📝 CHAT - Tracking AI message in conversation:", currentConversationId);
            console.log("📝 CHAT - AI response:", answerText.substring(0, 100) + (answerText.length > 100 ? "..." : ""));
            console.log("📝 CHAT - Question ID from backend:", questionId);
            // Pass the current conversation ID to trackMessage
            trackMessage(answerText, "AI", questionId, currentConversationId);
          }
          
          // Update loading message to personalizing stage
          setLoadingStage("personalizing");
          setMessages((prev) => 
            prev.map(msg => 
              msg.id === loadingId 
                ? { ...msg, stage: "personalizing" } 
                : msg
            )
          );
          
          // Prepare data for personalization
          const dataForPersonalization = {
            ...data,
            // Ensure we have an answer object for the personalization function
            answer: { 
              answerText: answerText,
              answerId: data.answers?.[0]?.answerId || data.answer?.answerId || data.questionId
            }
          };
          
          console.log("🧠 [HANDLE_SEND] Starting personalization process after receiving answer...");
          console.log("📊 [HANDLE_SEND] Data being sent to personalization:", JSON.stringify(dataForPersonalization, null, 2));
          
          try {
            // Get a personalized answer with the modified data
            console.log(`🔄 [HANDLE_SEND] Calling getPersonalizedAnswer with:
              - originalQuestion: ${originalQuestion}
              - answer text available: ${answerText.substring(0, 50)}...
            `);
            
            const personalizedResult = await getPersonalizedAnswer(originalQuestion, dataForPersonalization);
            console.log("✅ [HANDLE_SEND] Personalization result received:", personalizedResult);
            
            // Remove the loading animation
            setLoading(false);
            setMessages((prev) => prev.filter(msg => !msg.isLoading || msg.id !== loadingId));
            
            // Clear the loading stage intervals
            loadingIntervals.forEach(clearTimeout);
            
            if (personalizedResult && personalizedResult.personalizedAnswer) {
              console.log("🎯 [HANDLE_SEND] Displaying personalized answer");
              
              // Check if the personalized answer contains an error message
              const personalizedAnswer = personalizedResult.personalizedAnswer.trim();
              const isErrorResponse = personalizedAnswer.includes("ERROR:") || 
                                      personalizedAnswer.includes("Failed to call Gemini API") ||
                                      personalizedAnswer.includes("NOT_FOUND");
              
              if (isErrorResponse) {
                console.error("❌ [HANDLE_SEND] Backend returned a Gemini API error:", personalizedAnswer);
                
                // If personalization failed, show the original answer
                const similarityText = data.similarityScore 
                  ? ` (Similarity: ${(data.similarityScore * 100).toFixed(1)}%)` 
                  : '';
                
                setMessages((prev) => [
                  ...prev, 
                  { 
                    text: `${answerText}${similarityText}`, 
                    sender: "ai"
                  }
                ]);
                
                // Show a message explaining the personalization failure
                setMessages((prev) => [
                  ...prev, 
                  { 
                    text: "I apologize, but I couldn't personalize my answer at this time. Our AI personalization service is temporarily unavailable.", 
                    sender: "system"
                  }
                ]);
                
                // Also inform developers about the issue in console
                console.warn("⚠️ [HANDLE_SEND] To fix this issue, check the Gemini API configuration in the backend.");
                console.warn("⚠️ [HANDLE_SEND] The error suggests using an invalid model name or API version.");
              } else {
                // Display the personalized answer as the primary AI response
                setMessages((prev) => [
                  ...prev, 
                  { 
                    text: personalizedAnswer, 
                    sender: "ai",
                    isPersonalized: true
                  }
                ]);
                
                // Track personalized AI response with question ID from backend
                if (currentConversationId) {
                  console.log("📝 CHAT - Tracking PERSONALIZED_AI message in conversation:", currentConversationId);
                  console.log("📝 CHAT - Personalized response:", personalizedAnswer.substring(0, 100) + (personalizedAnswer.length > 100 ? "..." : ""));
                  console.log("📝 CHAT - Question ID for personalized response:", questionId);
                  // Pass the current conversation ID to trackMessage
                  trackMessage(
                    personalizedAnswer,
                    "PERSONALIZED_AI", // Keep the original message type
                    questionId,
                    currentConversationId
                  );
                }
                
                // Add subtle metadata about the personalization
                setTimeout(() => {
                  const metadata = [
                    `Personalized by ${personalizedResult.model || "Gemini AI"}`,
                    personalizedResult.generatedAt ? `Generated at: ${new Date(personalizedResult.generatedAt).toLocaleTimeString()}` : ''
                  ].filter(Boolean).join(' • ');
                  
                  setMessages((prev) => [
                    ...prev, 
                    { 
                      text: metadata, 
                      sender: "system",
                      isMetadata: true
                    }
                  ]);
                }, 500);
              }
            } else {
              console.warn("⚠️ [HANDLE_SEND] No personalized answer received");
              
              // If personalization failed, show the original answer
              const similarityText = data.similarityScore 
                ? ` (Similarity: ${(data.similarityScore * 100).toFixed(1)}%)` 
                : '';
              
              setMessages((prev) => [
                ...prev, 
                { 
                  text: `${answerText}${similarityText}`, 
                  sender: "ai"
                }
              ]);
              
              // Show a message explaining the personalization failure
              setMessages((prev) => [
                ...prev, 
                { 
                  text: "Note: Personalization service is currently unavailable.", 
                  sender: "system"
                }
              ]);
            }
          } catch (personalizationError) {
            console.error("❌ [HANDLE_SEND] Error in personalization process:", personalizationError);
            console.error("❌ [HANDLE_SEND] Error stack:", personalizationError.stack);
            
            // Remove the loading animation
            setLoading(false);
            setMessages((prev) => prev.filter(msg => !msg.isLoading || msg.id !== loadingId));
            
            // Clear the loading stage intervals
            loadingIntervals.forEach(clearTimeout);
            
            // If personalization failed, show the original answer
            const similarityText = data.similarityScore 
              ? ` (Similarity: ${(data.similarityScore * 100).toFixed(1)}%)` 
              : '';
            
            setMessages((prev) => [
              ...prev, 
              { 
                text: `${answerText}${similarityText}`, 
                sender: "ai"
              }
            ]);
            
            setMessages((prev) => [
              ...prev, 
              { 
                text: `Error personalizing answer: ${personalizationError.message || "Unknown error"}`, 
                sender: "system"
              }
            ]);
          }
        } else if (data.needsHumanAnswer) {
          // Remove the loading animation
          setLoading(false);
          setMessages((prev) => prev.filter(msg => !msg.isLoading || msg.id !== loadingId));
          
          // Clear the loading stage intervals
          loadingIntervals.forEach(clearTimeout);
          
          // If a human answer is needed
          const questionId = data.questionId || "unknown";
            
          const humanRequiredMessage = `Your question requires human expertise. It has been forwarded to our team (Question ID: ${questionId}).`;
          
          setMessages((prev) => [
            ...prev,
            { 
              text: humanRequiredMessage, 
              sender: "ai" 
            },
          ]);
          
          // Track AI response (don't await)
          if (currentConversationId) {
            trackMessage(humanRequiredMessage, "AI", questionId, currentConversationId);
          }
        } else {
          // Remove the loading animation
          setLoading(false);
          setMessages((prev) => prev.filter(msg => !msg.isLoading || msg.id !== loadingId));
          
          // Clear the loading stage intervals
          loadingIntervals.forEach(clearTimeout);
          
          // Check if we have no answers (answer is null and similarityScore is 0)
          if ((data.answer === null || data.answers?.length === 0) && 
              (data.similarityScore === 0 || !data.similarityScore)) {
            console.log("⚠️ [HANDLE_SEND] No answers found in database for question:", originalQuestion);
            
            // Custom message for questions with no answers in the database
            const noAnswerResponse = "I don't have an answer to this question in our database yet. " +
              "If you'd like to receive an answer when it's available, please provide your name and email address.";
            
            setMessages((prev) => [
              ...prev,
              { 
                text: noAnswerResponse, 
                sender: "ai",
                isNoAnswer: true
              }
            ]);
            
            // Track the AI response
            if (currentConversationId) {
              trackMessage(noAnswerResponse, "AI", data.questionId, currentConversationId);
            }
            
            // Set state to indicate we're collecting user info
            setCollectingUserInfo(true);
            setPendingQuestionId(data.questionId);
            setPendingQuestion(originalQuestion);
            
            // Make a request to the user details endpoint to inform the backend
            try {
              const userDetailsRequest = {
                userId: userId,
                conversationId: currentConversationId,
                originalQuestion: originalQuestion
              };
              
              console.log("📤 [NO_ANSWER] Requesting user details:", userDetailsRequest);
              
              fetch(`${BACKEND_URL}/api/user-details/request`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Accept": "application/json",
                  "X-API-KEY": apiKey
                },
                body: JSON.stringify(userDetailsRequest)
              })
              .then(response => {
                if (!response.ok) {
                  console.error(`❌ [NO_ANSWER] Request failed: ${response.status}`);
                  return null;
                }
                return response.json();
              })
              .then(data => {
                if (data && data.answer) {
                  console.log("✅ [NO_ANSWER] Received answer from backend:", data.answer);
                  
                  // Update the no-answer message with the response
                  setMessages((prev) => 
                    prev.map(msg => 
                      msg.isNoAnswer ? { ...msg, text: data.answer } : msg
                    )
                  );
                  
                  // Track the updated message
                  if (currentConversationId) {
                    trackMessage(data.answer, "AI", data.questionId || pendingQuestionId, currentConversationId);
                  }
                }
              })
              .catch(error => {
                console.error("❌ [NO_ANSWER] Error requesting user details:", error);
              });
            } catch (error) {
              console.error("❌ [NO_ANSWER] Error in user details request:", error);
            }
          } else {
            // Fallback message if no answer is available
            const questionId = data.questionId || "unknown";
            
            const fallbackMessage = `Thank you for your question. We're processing your inquiry (Question ID: ${questionId}).`;
              
            setMessages((prev) => [
              ...prev,
              { 
                text: fallbackMessage, 
                sender: "ai" 
              }
            ]);
            
            // Track AI response (don't await)
            if (currentConversationId) {
              trackMessage(fallbackMessage, "AI", questionId, currentConversationId);
            }
          }
        }
      } else {
        // Remove the loading animation
        setLoading(false);
        setMessages((prev) => prev.filter(msg => !msg.isLoading || msg.id !== loadingId));
        
        // Clear the loading stage intervals
        loadingIntervals.forEach(clearTimeout);
        
        // Handle empty data response
        setMessages((prev) => [
          ...prev,
          {
            text: "I received an empty response from our knowledge base. Please try a different question.",
            sender: "ai"
          }
        ]);
      }
      
    } catch (err) {
      // Remove the loading animation if there's an error
      setLoading(false);
      setMessages((prev) => prev.filter(msg => !msg.isLoading || msg.id !== loadingId));
      
      // Clear the loading stage intervals
      loadingIntervals.forEach(clearTimeout);
      
      console.error("Error communicating with the backend:", err);
      
      // Check if this is a connection error (server unreachable)
      if (err.message === "Failed to fetch") {
        console.warn("Server connection failed - using demo mode responses");
        
        // Provide a demo response
        const demoResponses = [
          "I'm sorry, but I'm currently running in demo mode because the server is unreachable. Limited functionality is available.",
          "This is a sample response. In normal operation, you would receive a real answer from the backend.",
          "In demo mode, I can acknowledge your question but cannot provide a specific answer without connecting to the server.",
          "Your question has been received. When the server is back online, you'll be able to get actual responses.",
          "The system is operating in offline mode. Please check your server connection and try again later."
        ];
        
        // Pick a random demo response
        const randomResponse = demoResponses[Math.floor(Math.random() * demoResponses.length)];
        
        setMessages((prev) => [
          ...prev,
          {
            text: randomResponse,
            sender: "ai"
          }
        ]);
        
        // Track AI response (don't await)
        if (currentConversationId) {
          trackMessage(randomResponse, "AI", null, currentConversationId);
        }
        
        // Add a system message explaining the demo mode
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              text: "DEMO MODE: The backend server is currently unreachable. Limited functionality available.",
              sender: "system"
            }
          ]);
        }, 500);
      } 
      // Check if this is a 500 Internal Server Error
      else if (err.message.includes("500") || err.message.includes("Internal Server Error") || err.message.includes("An error occurred while processing")) {
        console.error("❌ [HANDLE_SEND] Backend server returned a 500 Internal Server Error");
        console.error("❌ [HANDLE_SEND] This indicates a problem on the server side, likely in question processing");
        
        // Show a helpful message to the user
        const errorMessage = "I'm sorry, but our server encountered an internal error while processing your question. Our team has been notified of this issue.";
        
        setMessages((prev) => [
          ...prev,
          {
            text: errorMessage,
            sender: "ai"
          }
        ]);
        
        // Track AI error response (don't await)
        if (currentConversationId) {
          trackMessage(errorMessage, "AI", null, currentConversationId);
        }
        
        // Add technical details for developers
        setMessages((prev) => [
          ...prev,
          {
            text: "Technical error: 500 Internal Server Error occurred while processing the question. This may indicate an issue with question processing, database connectivity, or the AI component.",
            sender: "system"
          }
        ]);
        
        // Log more details to help debug
        console.log("📋 [DEBUG] Question that caused error:", originalQuestion);
        console.log("📋 [DEBUG] API endpoint:", `${BACKEND_URL}/api/widget/submitQuestion?apiKey=${apiKey}`);
        console.log("📋 [DEBUG] Request payload:", {
          questionTitle: "User Question",
          questionText: originalQuestion,
          businessId: businessId,
          userId: userId
        });
      } 
      // Handle other errors normally
      else {
        const errorMessage = "Failed to send message. Ensure the backend is running.";
        
        setMessages((prev) => [
          ...prev,
          {
            text: errorMessage,
            sender: "system"
          }
        ]);
        
        // Track system error message (don't await)
        if (currentConversationId) {
          trackMessage(errorMessage, "SYSTEM_ERROR", null, currentConversationId);
        }
        if (currentConversationId) {
          trackMessage(errorMessage, "SYSTEM_ERROR", null, currentConversationId);
        }
      }
    }
  };

  const getanswer = async () => {
    if (!answerId) {
      console.error("No answer ID available");
      return;
    }
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/answers/${answerId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("jwt")}`,
          "X-API-KEY": apiKey
        }
      });

      if (!response.ok) {
        console.error("Failed to fetch answer details:", response.statusText);
        return;
      }

      const data = await response.json();
      console.log("✅ Answer details:", data);
      
      if (data && data.answerText) {
        setAnswer(data.answerText);
        console.log("Answer ID:", answerId);
        console.log("Answer:", data.answerText);
      } else {
        console.warn("Answer data is incomplete:", data);
      }
    } catch (err) {
      console.error("Error fetching answer details:", err);
    }
  }

  // Update the test function with more detailed test data
  const testPersonalizationEndpoint = async () => {
    console.log("🧪 [TEST] Testing personalization endpoint directly");
    
    // Create a more detailed test payload with rich context
    const testPayload = {
      askedQuestion: "How does your product help with customer support?",
      similarQuestionFromDB: "Support Efficiency: How does the system improve customer support operations?",
      answerFromDB: "Our system helps customer support teams by automating routine inquiries through chatbots, categorizing tickets by priority using AI, providing agents with relevant customer history and product information, and generating performance analytics to identify bottlenecks and training opportunities.",
      context: "This is a question about SupportHub, which is a SaaS platform designed to streamline customer support operations. It includes features like AI-powered ticket categorization, knowledge base management, automated responses, and analytics dashboards. The user is asking about the specific benefits for support teams.",
      questionId: null,
      businessId: businessId ? Number(businessId) : null
    };
    
    console.log("🧪 [TEST] Test payload:", JSON.stringify(testPayload, null, 2));
    
    try {
      // Show a test message in the chat
      setMessages((prev) => [
        ...prev, 
        { 
          text: "Testing personalization API...", 
          sender: "system"
        }
      ]);
      
      const response = await fetch(`${BACKEND_URL}/api/ai-answers/personalize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("jwt")}`,
          "X-API-KEY": apiKey,
          "Origin": window.location.origin
        },
        body: JSON.stringify(testPayload),
        credentials: "include",
        mode: "cors"
      });
      
      console.log(`🧪 [TEST] Response status: ${response.status} ${response.statusText}`);
      
      // Get response headers
      const headers = {};
      response.headers.forEach((value, name) => {
        headers[name] = value;
      });
      console.log("🧪 [TEST] Response headers:", headers);
      
      const responseText = await response.text();
      console.log("🧪 [TEST] Raw response:", responseText);
      
      if (!response.ok) {
        console.error("🧪 [TEST] Error response:", {
          status: response.status,
          statusText: response.statusText,
          body: responseText
        });
        setMessages((prev) => [
          ...prev, 
          { 
            text: `Test failed: ${response.status} ${response.statusText}`, 
            sender: "system"
          }
        ]);
        return;
      }
      
      try {
        const data = JSON.parse(responseText);
        console.log("🧪 [TEST] Parsed response:", data);
        
        // Check if the response contains an error
        const isErrorResponse = data.personalizedAnswer && (
          data.personalizedAnswer.includes("ERROR:") || 
          data.personalizedAnswer.includes("Failed to call Gemini API") ||
          data.personalizedAnswer.includes("NOT_FOUND")
        );
        
        if (isErrorResponse) {
          console.error("🧪 [TEST] The backend returned a Gemini API error:", data.personalizedAnswer);
          
          setMessages((prev) => [
            ...prev, 
            { 
              text: "Test completed, but the backend reported a Gemini API issue.", 
              sender: "system"
            }
          ]);
          
          // Add technical details for developers
          setMessages((prev) => [
            ...prev, 
            { 
              text: `Technical error: ${data.personalizedAnswer}`, 
              sender: "system"
            }
          ]);
          
          // Provide troubleshooting info
          setMessages((prev) => [
            ...prev, 
            { 
              text: "To fix this issue, check your backend configuration for the Gemini API. The error suggests an invalid model name or API version.", 
              sender: "system"
            }
          ]);
        } else if (data.personalizedAnswer) {
          // Display full details of the response for successful tests
          setMessages((prev) => [
            ...prev, 
            { 
              text: `Test successful! Personalized answer: ${data.personalizedAnswer}`, 
              sender: "ai"
            }
          ]);
          
          // Also display metadata about the personalization
          const metadata = [
            `Model: ${data.model || "Unknown"}`,
            `Generated at: ${data.generatedAt || "Unknown"}`,
            `Is personalized: ${data.isPersonalized ? "Yes" : "No"}`,
            `Similarity score: ${data.similarityScore ? (data.similarityScore * 100).toFixed(1) + "%" : "Unknown"}`
          ].join("\n");
          
          setMessages((prev) => [
            ...prev, 
            { 
              text: `Personalization metadata:\n${metadata}`, 
              sender: "system"
            }
          ]);
        } else {
          // Handle case where personalizedAnswer is missing
          setMessages((prev) => [
            ...prev, 
            { 
              text: `Test completed but no personalized answer was returned. Full response: ${JSON.stringify(data)}`, 
              sender: "system"
            }
          ]);
        }
      } catch (e) {
        console.error("🧪 [TEST] Failed to parse JSON response:", e);
        setMessages((prev) => [
          ...prev, 
          { 
            text: `Test failed: Could not parse response - ${e.message}`, 
            sender: "system"
          }
        ]);
      }
    } catch (error) {
      console.error("🧪 [TEST] Error during test:", error);
      setMessages((prev) => [
        ...prev, 
        { 
          text: `Test failed: ${error.message}`, 
          sender: "system"
        }
      ]);
    }
  };

  // Loading animation component
  const LoadingAnimation = ({ stage }) => {
    let loadingText = "Thinking";
    let currentStage = stage || loadingStage;
    
    if (currentStage === "processing") {
      loadingText = "Processing your question";
    } else if (currentStage === "analyzing") {
      loadingText = "Analyzing knowledge base";
    } else if (currentStage === "personalizing") {
      loadingText = "Creating personalized answer";
    } else if (currentStage === "verifying") {
      loadingText = "Verifying API key";
    }
    
    return (
      <div className="ai-thinking">
        <div className="thinking-brain">
          <span className="brain-icon"></span>
          {loadingText}
        </div>
        <div className="thinking-indicator">
          Working on it
          <div className="thinking-dots">
            <div className="thinking-dot"></div>
            <div className="thinking-dot"></div>
            <div className="thinking-dot"></div>
          </div>
        </div>
        <div className="progress-container">
          <div className="progress-bar"></div>
        </div>
      </div>
    );
  };

  // Component cleanup
  useEffect(() => {
    return () => {
      // End the conversation when the component unmounts
      if (conversationId && !conversationEnded.current) {
        console.log("🔴 Ending conversation on component unmount");
        endConversation();
      }
    };
  }, [conversationId]);

  // Function to scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Dynamic styles based on widgetConfig
  const widgetContainerStyle = {
    fontFamily: widgetConfig.fontFamily,
    backgroundColor: widgetConfig.secondaryColor,
    borderRadius: widgetConfig.widgetShape === "rounded" ? "15px" : "0px",
    // Position is handled by class name
  };

  const floatingButtonStyle = {
    backgroundColor: widgetConfig.primaryColor,
    // Assuming launcherIcon is text for now, if it's an icon, this might need to change
  };

  const headerStyle = {
    backgroundColor: widgetConfig.primaryColor,
    color: 'white', // Changed for better contrast on primary color
    fontFamily: widgetConfig.fontFamily,
  };

  const chatContentStyle = {
    backgroundColor: widgetConfig.secondaryColor, // Or a lighter shade
    color: widgetConfig.textColor,
    fontFamily: widgetConfig.fontFamily,
  };
  
  const messageStyle = (sender) => ({
    color: widgetConfig.textColor,
    fontFamily: widgetConfig.fontFamily,
    // Specific background for user/ai messages can remain in CSS or be customized here
    // For example:
    // backgroundColor: sender === 'user' ? widgetConfig.primaryColor : widgetConfig.secondaryColor,
    // color: sender === 'user' ? '#ffffff' : widgetConfig.textColor, // Assuming white text on primary color
  });

  const inputStyle = {
    fontFamily: widgetConfig.fontFamily,
    borderColor: widgetConfig.primaryColor, // For focus or general border
    backgroundColor: widgetConfig.secondaryColor, // Or a specific input background
    color: widgetConfig.textColor,
  };

  const sendButtonStyle = {
    backgroundColor: widgetConfig.primaryColor,
    color: 'white', // Ensure icon/text is white for contrast
    fontFamily: widgetConfig.fontFamily,
    padding: '8px', // Adjust padding for an icon button
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none', // Clean up button style for icon
    borderRadius: '50%', // Make it circular if desired, or use widgetConfig.widgetShape
  };

  const welcomeMessageStyle = {
    backgroundColor: widgetConfig.secondaryColor, // Or a slightly different shade
    color: widgetConfig.textColor,
    fontFamily: widgetConfig.fontFamily,
    padding: '10px',
    margin: '10px',
    borderRadius: '8px',
    textAlign: 'center'
  };
  
  // Determine widget position class
  const widgetPositionClass = widgetConfig.widgetPosition === "bottom-left" ? "bottom-left" : "bottom-right";

  return (
    <>
      {/* The floating button that toggles the chat widget */}
      <button 
        className="floating-button"
        onClick={toggleWidget}
        style={floatingButtonStyle}
      >
        {/* Render launcherIcon as a Material Icon */}
        <span className="material-icons-outlined" style={{ color: 'white', fontSize: '24px' }}>
          {widgetConfig.launcherIcon || "chat_bubble"}
        </span>
      </button>

      {/* The chat widget UI, only shown when isVisible == true */}
      {isVisible && (
        <div 
          className={`chat-widget ${widgetPositionClass}`}
          style={widgetContainerStyle}
        >
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
              <div className="chat-header" style={headerStyle}>
                <h4>{widgetConfig.headerText}</h4>
                <div>
                  <button 
                    className="logout-button" 
                    onClick={handleLogout} 
                    // Optionally style logout button with widgetConfig colors
                    // style={{ backgroundColor: widgetConfig.primaryColor, color: 'white' }}
                  >
                    Logout
                  </button>
                  <button className="close-button" onClick={toggleWidget} style={{ color: 'white' /* Ensure contrast against header background */ }}>
                    ✖
                  </button>
                </div>
              </div>

              {/* Show API Key input if businessId is not set yet */}
              {!businessId && (
                <div className="api-key-section" style={{backgroundColor: widgetConfig.secondaryColor}}>
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
                      style={{fontFamily: widgetConfig.fontFamily, color: widgetConfig.textColor}}
                    />
                    <button 
                      type="submit" 
                      className="api-key-submit"
                      disabled={!apiKey?.trim()}
                      style={{backgroundColor: widgetConfig.primaryColor, color: 'white', fontFamily: widgetConfig.fontFamily}}
                    >
                      Verify API Key
                    </button>
                    {error && <div className="error-message" style={{fontFamily: widgetConfig.fontFamily, color: widgetConfig.textColor}}>{error}</div>}
                  </form>
                </div>
              )}

              {businessId && (
                <div className="api-key-section" style={{ margin: '10px 0', padding: '10px', backgroundColor: widgetConfig.secondaryColor, borderRadius: '4px' }}>
                  <button 
                    onClick={testPersonalizationEndpoint}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: widgetConfig.primaryColor,
                      color: 'white', // Assuming white text on primary color
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontFamily: widgetConfig.fontFamily
                    }}
                  >
                    Test Personalization API
                  </button>
                  <div style={{ marginTop: '5px', fontSize: '12px', color: widgetConfig.textColor, fontFamily: widgetConfig.fontFamily }}>
                    Use this button to test the personalization API directly
                  </div>
                </div>
              )}

              <div className="chat-content" style={chatContentStyle}>
                {widgetConfig.showWelcomeMessage && messages.length === 0 && (
                  <div className="chat-message system" style={{...welcomeMessageStyle, ...messageStyle('system')}}>
                    {aiPersonality.greetingMessage || widgetConfig.welcomeMessage}
                  </div>
                )}
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
                      style={messageStyle(msg.sender)} // Apply dynamic message style
                    >
                      {msg.isPersonalized && <div className="personalized-badge" style={{fontSize: '0.7em', marginBottom: '4px', color: widgetConfig.primaryColor /* or a specific accent color */}}>✨ Personalized</div>}
                      {msg.text}
                    </div>
                  );
                })}
                {/* Empty div that serves as a reference point for scrolling */}
                <div ref={messagesEndRef} />
              </div>

              <div className="chat-input" style={{borderTop: `1px solid ${widgetConfig.primaryColor}`, backgroundColor: widgetConfig.secondaryColor}}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  disabled={!businessId || loading}
                  style={inputStyle} // Apply dynamic input style
                />
                <button 
                  onClick={handleSend} 
                  disabled={!businessId || loading || !input.trim()}
                  style={sendButtonStyle} // Apply dynamic send button style
                >
                  {/* Use Material Icon for send */}
                  <span className="material-icons-outlined">
                    send
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default Widget;

