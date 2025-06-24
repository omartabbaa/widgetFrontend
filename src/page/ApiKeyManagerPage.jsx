import React, { useState } from "react";
import "./ApiKeyManagerPage.css";

/**
 * A React component for creating, fetching, and deactivating API keys
 * using your Spring Boot endpoints under /api/admin/api-keys.
 */
function ApiKeyManagerPage() {
  const [businessId, setBusinessId] = useState("");
  const [generatedKey, setGeneratedKey] = useState("");
  const [apiKeys, setApiKeys] = useState([]);
  const [error, setError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  /**
   * Sends a POST request to /api/admin/api-keys/generate
   * with a JSON body { businessId: ... }.
   * Expects a JSON response (ApiKeyResponse).
   */
  const handleGenerateApiKey = async () => {
    if (!businessId?.trim()) {
      setError("Please enter a valid Business ID.");
      return;
    }
  
    setError(null);
    setIsGenerating(true);
  
    try {
      const response = await fetch("http://localhost:8082/api/admin/api-keys/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          businessId: Number(businessId)
        }),
        credentials: "include"
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message ||
            `Error generating API key: ${response.status} ${response.statusText}`
        );
      }
  
      const apiKeyResponse = await response.json();
      setGeneratedKey(apiKeyResponse.apiKey);
      await fetchApiKeys();
    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred while generating the API key.");
      setGeneratedKey("");
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Fetch active API keys for a business:
   * GET /api/admin/api-keys/business/{businessId}
   * Returns a Set<ApiKeyResponse> as JSON.
   */
  const fetchApiKeys = async () => {
    if (!businessId?.trim()) {
      setError("Please enter a valid Business ID.");
      return;
    }

    setError(null);
    setIsFetching(true);

    try {
      const url = `http://localhost:8082/api/admin/api-keys/business/${encodeURIComponent(businessId)}`;
      const response = await fetch(url, {
        headers: {
          "Accept": "application/json"
        },
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message ||
            `Error fetching API keys: ${response.status} ${response.statusText}`
        );
      }

      const keys = await response.json();
      setApiKeys(keys);
    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred while fetching API keys.");
      setApiKeys([]);
    } finally {
      setIsFetching(false);
    }
  };

  /**
   * Deactivate an API key:
   * POST /api/admin/api-keys/deactivate/{apiKeyValue}
   * Returns a single ApiKeyResponse with active=false
   */
  const deactivateApiKey = async (keyValue) => {
    setError(null);
    setIsDeactivating(true);

    try {
      const url = `http://localhost:8082/api/admin/api-keys/deactivate/${encodeURIComponent(keyValue)}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Accept": "application/json"
        },
        credentials: "include"
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message ||
            `Error deactivating API key: ${response.status} ${response.statusText}`
        );
      }

      // If successful, remove from local list or re-fetch
      await fetchApiKeys();
    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred while deactivating the API key.");
    } finally {
      setIsDeactivating(false);
    }
  };

  return (
    <div className="api-key-manager-page">
      <h1>API Key Manager</h1>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <div className="form-section">
        <label htmlFor="businessIdInput" className="label">
          Business ID
        </label>
        <input
          id="businessIdInput"
          className="input-field"
          type="text"
          value={businessId}
          onChange={(e) => {
            setBusinessId(e.target.value);
            setError(null); // clear error on change
          }}
          placeholder="Enter Business ID"
          disabled={isGenerating || isFetching || isDeactivating}
        />
        <button
          className="button generate-button"
          onClick={handleGenerateApiKey}
          disabled={isGenerating || isFetching || isDeactivating}
        >
          {isGenerating ? "Generating..." : "Generate API Key"}
        </button>
        <button
          className="button fetch-button"
          onClick={fetchApiKeys}
          disabled={isGenerating || isFetching || isDeactivating}
        >
          {isFetching ? "Fetching..." : "Fetch Active Keys"}
        </button>
      </div>

      {generatedKey && (
        <div className="generated-key-section">
          <h2>Newly Generated Key</h2>
          <p className="generated-key">{generatedKey}</p>
        </div>
      )}

      <div className="api-keys-section">
        <h2>Active API Keys</h2>
        {apiKeys.length === 0 ? (
          <p>No active API keys found for this business.</p>
        ) : (
          <table className="api-keys-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Key Value</th>
                <th>Description</th>
                <th>Active</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map((apiKey) => (
                <tr key={apiKey.keyValue}>
                  <td>{apiKey.id}</td>
                  <td>{apiKey.keyValue}</td>
                  <td>{apiKey.description || "N/A"}</td>
                  <td>{apiKey.active ? "Yes" : "No"}</td>
                  <td>
                    {apiKey.active && (
                      <button
                        onClick={() => deactivateApiKey(apiKey.keyValue)}
                        disabled={isDeactivating}
                      >
                        {isDeactivating ? "Deactivating..." : "Deactivate"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default ApiKeyManagerPage;