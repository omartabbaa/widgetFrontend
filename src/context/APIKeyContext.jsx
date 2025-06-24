import React, { createContext, useState, useContext } from 'react';
import { BACKEND_URL } from '../config';

const APIKeyContext = createContext(null);

export const APIKeyProvider = ({ children }) => {
  const [apiKey, setApiKey] = useState("eFOeIlZtQ0wTWbWnJhWUDLdXoW1tAshz");
  const [businessId, setBusinessId] = useState(null);
  const [error, setError] = useState("");

  const verifyApiKey = async () => {
    if (!apiKey?.trim()) {
      setError("Please enter a valid API key");
      setBusinessId(null);
      return;
    }

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

      if (response.ok && data.status === "success") {
        setBusinessId(data.businessId);
        setError("");
        console.log("Successfully verified API key. Business ID:", data.businessId);
        return data.businessId;
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
      
      console.error("API Key verification failed:", {
        status: response.status,
        responseData: data,
        statusText: response.statusText
      });
    } catch (err) {
      console.error("Error verifying API key:", err);
      setError(err.message || "Failed to connect to the server. Please check your connection and try again.");
      setBusinessId(null);
    }
  };

  const clearApiKey = () => {
    setApiKey("");
    setBusinessId(null);
    setError("");
  };

  return (
    <APIKeyContext.Provider value={{ 
      apiKey, 
      setApiKey, 
      businessId, 
      setBusinessId,
      error,
      setError,
      verifyApiKey,
      clearApiKey
    }}>
      {children}
    </APIKeyContext.Provider>
  );
};

export const useAPIKey = () => {
  const context = useContext(APIKeyContext);
  if (!context) {
    throw new Error('useAPIKey must be used within an APIKeyProvider');
  }
  return context;
}; 