import React, { createContext, useState, useEffect, useContext } from 'react';
import { BACKEND_URL } from '../config';

// Default widget configuration
const DEFAULT_CONFIG = {
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
};

// Create context for widget configuration
const WidgetConfigContext = createContext();

export const useWidgetConfig = () => useContext(WidgetConfigContext);

export const WidgetConfigProvider = ({ children, businessId, apiKey }) => {
  const [widgetConfig, setWidgetConfig] = useState(DEFAULT_CONFIG);
  const [configLoading, setConfigLoading] = useState(false);
  const [configError, setConfigError] = useState(null);

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

  // Fetch widget configuration from backend
  useEffect(() => {
    if (!businessId || !apiKey) return;

    const fetchWidgetConfig = async () => {
      setConfigLoading(true);
      setConfigError(null);

      try {
        const response = await fetch(`${BACKEND_URL}/api/widget-configurations/business/${businessId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-API-KEY': apiKey
          }
        });

        if (!response.ok) {
          // If we can't fetch config, just use defaults
          console.warn(`Failed to fetch widget configuration: ${response.status}. Using defaults.`);
          setConfigError(`Could not load custom widget settings (${response.status}). Using defaults.`);
          setConfigLoading(false);
          return;
        }

        const data = await response.json();
        console.log('Fetched widget configuration:', data);
        
        // Merge with defaults to ensure all properties exist
        setWidgetConfig({
          ...DEFAULT_CONFIG,
          ...data
        });
      } catch (error) {
        console.error('Error fetching widget configuration:', error);
        setConfigError(`Failed to load widget settings: ${error.message}. Using defaults.`);
      } finally {
        setConfigLoading(false);
      }
    };

    fetchWidgetConfig();
  }, [businessId, apiKey]);

  return (
    <WidgetConfigContext.Provider value={{ 
      widgetConfig, 
      configLoading, 
      configError,
      // Add function to reload config if needed
      reloadConfig: () => {
        if (businessId && apiKey) {
          setConfigLoading(true);
          // This will trigger the useEffect above
          setWidgetConfig(DEFAULT_CONFIG);
        }
      }
    }}>
      {children}
    </WidgetConfigContext.Provider>
  );
};

export default WidgetConfigProvider; 