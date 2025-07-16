import React, { createContext, useState, useContext, useCallback } from 'react';
import { BACKEND_URL } from '../config';

const SubscriptionContext = createContext(null);

export const SubscriptionProvider = ({ children }) => {
  const [conversationsCount, setConversationsCount] = useState(0);
  const [maxConversations, setMaxConversations] = useState(-1); // -1 means unlimited
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Monthly reset test states
  const [resetCheckData, setResetCheckData] = useState(null);
  const [isCheckingReset, setIsCheckingReset] = useState(false);
  const [isForcingReset, setIsForcingReset] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  // Invoice and plan states
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [invoiceError, setInvoiceError] = useState(null);

  // Helper to get usage percentage
  const getUsagePercentage = (current, max) => {
    if (!max || max === -1) return 0;
    return Math.round((current / max) * 100);
  };

  // Helper to format limit
  const formatLimitValue = (value) => {
    return value === -1 ? 'Unlimited' : value;
  };

  // Set up axios instance with token
  const getApiInstance = useCallback(() => {
    const token = localStorage.getItem('jwt');
    return {
      baseURL: BACKEND_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      withCredentials: true,
    };
  }, []);

  // Test function to check if monthly reset is needed
  const testCheckMonthlyReset = async (businessId, apiKey) => {
    if (!businessId || !apiKey) {
      setResetMessage('Missing business ID or API key.');
      return;
    }

    setIsCheckingReset(true);
    setResetMessage('');
    setResetCheckData(null);

    try {
      console.log('🔄 IMPORTANT: Monthly reset check result:', { businessId, apiKey });
      
      const response = await fetch(`${BACKEND_URL}/api/subscription-usage/business/${businessId}/should-reset`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-API-KEY": apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      setResetCheckData(data);
      setResetMessage(`Check completed: ${data.shouldReset}`);
      console.log('🔄 IMPORTANT: Monthly reset check result:', data);
    } catch (err) {
      setResetMessage(`Error checking reset: ${err.message}`);
      console.error('❌ IMPORTANT: Error checking monthly reset:', err);
    } finally {
      setIsCheckingReset(false);
    }
  };

  // Test function to force reset monthly usage
  const testForceResetMonthlyUsage = async (businessId, apiKey) => {
    if (!businessId || !apiKey) {
      setResetMessage('Missing business ID or API key.');
      return;
    }

    setIsForcingReset(true);
    setResetMessage('');

    try {
      console.log('🔄 IMPORTANT: Force reset result:', { businessId, apiKey });
      
      const response = await fetch(`${BACKEND_URL}/api/subscription-usage/business/${businessId}/force-reset-monthly-usage`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-API-KEY": apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      setResetMessage(`Force reset completed: ${data.message}`);
      console.log('🔄 IMPORTANT: Force reset result:', data);
      
      // Refresh conversations count after reset
      setTimeout(() => {
        fetchConversationsCount(businessId, apiKey);
      }, 1000);
    } catch (err) {
      setResetMessage(`Error forcing reset: ${err.message}`);
      console.error('❌ IMPORTANT: Error forcing monthly reset:', err);
    } finally {
      setIsForcingReset(false);
    }
  };

  // Fetch conversations count using direct API calls
  const fetchConversationsCount = useCallback(async (businessId, apiKey) => {
    if (!businessId || !apiKey) {
      setError('Missing business ID or API key.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      console.log('📊 IMPORTANT: Fetching conversations count for business:', businessId);
      
      // 1. Upsert business usage metrics
      const upsertResponse = await fetch(`${BACKEND_URL}/api/subscription-usage/business/${businessId}/upsert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-API-KEY": apiKey
        }
      });

      console.log("📥 IMPORTANT: Upsert response status:", upsertResponse.status);

      // 2. Calculate business metrics
      const calculateResponse = await fetch(`${BACKEND_URL}/api/subscription-usage/business/${businessId}/calculate`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-API-KEY": apiKey
        }
      });

      console.log("📥 IMPORTANT: Calculate response status:", calculateResponse.status);

      if (calculateResponse.ok) {
        const calculatedMetrics = await calculateResponse.json();
        console.log("📊 IMPORTANT: Calculated metrics:", JSON.stringify(calculatedMetrics, null, 2));
        
        const currentCount = calculatedMetrics?.conversationsCount || 0;
        
        // IMPORTANT: Only set maxConversations when API actually provides a value
        // Don't default to -1 (unlimited) when the field is undefined
        if (calculatedMetrics?.maxConversations != null) {
          setMaxConversations(calculatedMetrics.maxConversations);
        }
        
        setConversationsCount(currentCount);
        
        console.log(`📊 IMPORTANT: Usage - Current: ${currentCount}, Max: ${calculatedMetrics?.maxConversations != null ? calculatedMetrics.maxConversations : 'undefined'}`);
      } else {
        // 3. Fallback: get business analytics
        try {
          console.log("🔄 IMPORTANT: Trying fallback method to get conversations count...");
          
          const [countsResponse, timingResponse] = await Promise.all([
            fetch(`${BACKEND_URL}/api/agent-questions/count/business/${businessId}`, {
              headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "X-API-KEY": apiKey
              }
            }),
            fetch(`${BACKEND_URL}/api/agent-questions/timing/business/${businessId}`, {
              headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "X-API-KEY": apiKey
              }
            })
          ]);
          
          if (countsResponse.ok) {
            const countsData = await countsResponse.json();
            const fallbackCount = countsData?.totalQuestions || 0;
            console.log("📊 IMPORTANT: Fallback conversations count:", fallbackCount);
            setConversationsCount(fallbackCount);
          }
        } catch (fallbackErr) {
          console.error("❌ IMPORTANT: Fallback method also failed:", fallbackErr);
          setError('Failed to fetch conversations count.');
        }
      }
    } catch (err) {
      console.error("❌ IMPORTANT: Error fetching conversations count:", err);
      setError('Failed to fetch conversations count.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Automatic monthly reset check and trigger
  const checkAndAutoReset = useCallback(async (businessId, apiKey) => {
    if (!businessId || !apiKey) return;

    try {
      console.log('🔄 IMPORTANT: [Auto] Checking if monthly reset is needed...');
      
      // 1. Check if reset is needed
      const checkResponse = await fetch(`${BACKEND_URL}/api/subscription-usage/business/${businessId}/should-reset`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-API-KEY": apiKey
        }
      });

      if (!checkResponse.ok) {
        throw new Error(`HTTP error ${checkResponse.status}`);
      }

      const checkData = await checkResponse.json();
      console.log('🔄 IMPORTANT: [Auto] Reset check result:', checkData);
      
      if (checkData.shouldReset === "YES") {
        console.log('🔄 IMPORTANT: [Auto] Reset needed, triggering force reset...');
        
        // 2. If yes, force reset
        const resetResponse = await fetch(`${BACKEND_URL}/api/subscription-usage/business/${businessId}/force-reset-monthly-usage`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-API-KEY": apiKey
          }
        });

        if (!resetResponse.ok) {
          throw new Error(`HTTP error ${resetResponse.status}`);
        }

        const resetData = await resetResponse.json();
        console.log('🔄 IMPORTANT: [Auto] Force reset completed:', resetData);
        
        // 3. Refresh conversations count after reset
        setTimeout(() => {
          fetchConversationsCount(businessId, apiKey);
        }, 1000);
        
        setResetMessage(`Auto-reset completed: ${resetData.message}`);
      } else {
        console.log('🔄 IMPORTANT: [Auto] No reset needed at this time');
      }
    } catch (err) {
      console.error('❌ IMPORTANT: [Auto] Error in automatic reset check:', err);
      setResetMessage(`Auto-reset error: ${err.message}`);
    }
  }, [fetchConversationsCount]);

  // Check if user can create a new conversation
  const canCreateConversation = () => {
    if (maxConversations === -1) {
      console.log("✅ IMPORTANT: Unlimited conversations allowed");
      return true;
    }
    
    const canCreate = conversationsCount < maxConversations;
    console.log(`📊 IMPORTANT: Can create conversation - Current: ${conversationsCount}, Max: ${maxConversations}, Allowed: ${canCreate}`);
    return canCreate;
  };

  // Fetch pending invoices for a business
  const fetchPendingInvoices = useCallback(async (businessId, apiKey) => {
    if (!businessId || !apiKey) {
      setInvoiceError('Missing business ID or API key.');
      setIsLoadingInvoices(false);
      return;
    }

    setIsLoadingInvoices(true);
    setInvoiceError(null);

    try {
      console.log('📄 IMPORTANT: Fetching pending invoices for business:', businessId);
      
      const response = await fetch(`${BACKEND_URL}/api/subscription-invoices/business/${businessId}/status/PENDING`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-API-KEY": apiKey
        }
      });

      console.log("📥 IMPORTANT: Pending invoices response status:", response.status);

      if (response.ok) {
        const invoices = await response.json();
        console.log("📄 IMPORTANT: Pending invoices:", JSON.stringify(invoices, null, 2));
        
        setPendingInvoices(invoices);
        
        // If we have pending invoices, get the plan details from the first one
        if (invoices && invoices.length > 0) {
          const firstInvoice = invoices[0];
          if (firstInvoice.planId) {
            console.log("📋 IMPORTANT: Found Stripe price ID in invoice:", firstInvoice.planId);
            await fetchSubscriptionPlan(firstInvoice.planId, apiKey);
          }
        }
      } else {
        console.error("❌ IMPORTANT: Failed to fetch pending invoices:", response.status);
        setInvoiceError('Failed to fetch pending invoices.');
      }
    } catch (err) {
      console.error("❌ IMPORTANT: Error fetching pending invoices:", err);
      setInvoiceError('Failed to fetch pending invoices.');
    } finally {
      setIsLoadingInvoices(false);
    }
  }, []);

  // Fetch subscription plan details by Stripe price ID
  const fetchSubscriptionPlan = useCallback(async (stripePriceId, apiKey) => {
    if (!stripePriceId || !apiKey) {
      console.log("⚠️ IMPORTANT: Cannot fetch plan - missing stripePriceId or apiKey");
      return;
    }

    try {
      console.log('📋 IMPORTANT: Fetching subscription plan details for Stripe price ID:', stripePriceId);
      
      const response = await fetch(`${BACKEND_URL}/api/subscription-plans/stripe-price/${stripePriceId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-API-KEY": apiKey
        }
      });

      console.log("📥 IMPORTANT: Subscription plan response status:", response.status);

      if (response.ok) {
        const plan = await response.json();
        console.log("📋 IMPORTANT: Subscription plan details:", JSON.stringify(plan, null, 2));
        
        setCurrentPlan(plan);
        
        // Update maxConversations from the plan if available
        if (plan.maxConversations != null) {
          console.log("📊 IMPORTANT: Setting maxConversations from plan:", plan.maxConversations);
          setMaxConversations(plan.maxConversations);
        }
      } else {
        console.error("❌ IMPORTANT: Failed to fetch subscription plan:", response.status);
      }
    } catch (err) {
      console.error("❌ IMPORTANT: Error fetching subscription plan:", err);
    }
  }, []);

  // Fetch both pending invoices and plan details
  const fetchInvoiceAndPlanData = useCallback(async (businessId, apiKey) => {
    if (!businessId || !apiKey) {
      console.log("⚠️ IMPORTANT: Cannot fetch invoice/plan data - missing businessId or apiKey");
      return;
    }

    console.log("🔄 IMPORTANT: Fetching invoice and plan data for business:", businessId);
    
    // First fetch pending invoices
    await fetchPendingInvoices(businessId, apiKey);
    
    // The plan details will be fetched automatically if invoices are found
  }, [fetchPendingInvoices]);

  return (
    <SubscriptionContext.Provider value={{
      conversationsCount,
      maxConversations,
      isLoading,
      error,
      isRefreshing,
      resetCheckData,
      isCheckingReset,
      isForcingReset,
      resetMessage,
      getUsagePercentage,
      formatLimitValue,
      testCheckMonthlyReset,
      testForceResetMonthlyUsage,
      fetchConversationsCount,
      checkAndAutoReset,
      canCreateConversation,
      setResetMessage,
      // Invoice and plan data
      pendingInvoices,
      currentPlan,
      isLoadingInvoices,
      invoiceError,
      fetchPendingInvoices,
      fetchSubscriptionPlan,
      fetchInvoiceAndPlanData
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscriptionContext = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscriptionContext must be used within a SubscriptionProvider');
  }
  return context;
}; 