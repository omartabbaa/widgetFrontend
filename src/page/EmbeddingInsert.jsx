import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import './EmbeddingInsert.css';

function EmbeddingInsert() {
  const navigate = useNavigate();
  const { jwt, isAuthenticated, logout } = useAuth();
  
  // State variables for form fields
  const [endpoint, setEndpoint] = useState('projects');
  const [batchSize, setBatchSize] = useState(100);
  const [forceRegenerate, setForceRegenerate] = useState(false);
  const [maxItems, setMaxItems] = useState('');
  const [modelName, setModelName] = useState('text-embedding-ada-002');

  // State variables for handling the response and UI status
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Check authentication on component mount
  useEffect(() => {
    if (!isAuthenticated) {
      setError('Please log in to access this page');
      navigate('/');
      return;
    }
  }, [isAuthenticated, navigate]);

  // This function is called when the form is submitted.
  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setSuccessMessage(null);

    // Input validation
    if (batchSize <= 0) {
      setError('Batch size must be greater than 0');
      setLoading(false);
      return;
    }

    if (maxItems && maxItems <= 0) {
      setError('Max items must be greater than 0');
      setLoading(false);
      return;
    }

    // Create the request payload.
    const payload = {
      batchSize,
      forceRegenerate,
      maxItems: maxItems === '' ? null : parseInt(maxItems, 10),
      modelName: modelName.trim(),
    };

    try {
      // Use JWT from context
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${jwt}`,
        'X-API-KEY': 'eFOeIlZtQ0wTWbWnJhWUDLdXoW1tAshz'
      };

      console.log('Request headers:', headers);
      console.log('Request payload:', payload);

      const response = await fetch(`${BACKEND_URL}/api/admin/embeddings/${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      let data;
      try {
        const textResponse = await response.text();
        console.log('Raw response:', textResponse);
        
        if (!textResponse) {
          throw new Error('Empty response from server');
        }
        
        data = JSON.parse(textResponse);
        console.log('Response data:', data);
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        throw new Error('Invalid response format from server');
      }

      if (!response.ok) {
        // Handle specific error cases
        switch (response.status) {
          case 401:
            logout(); // Use logout from context
            navigate('/');
            throw new Error('Session expired. Please log in again.');
          case 403:
            throw new Error('You do not have permission to perform this action.');
          case 404:
            throw new Error('API endpoint not found. Please check your backend server is running.');
          case 429:
            throw new Error('Rate limit exceeded. Please try again later.');
          default:
            throw new Error(data.message || `Server responded with status ${response.status}`);
        }
      }

      setResult(data);
      setSuccessMessage(`Successfully processed embeddings for ${endpoint}`);
    } catch (err) {
      console.error('Error processing embeddings:', err);
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setError(`Network error: Unable to connect to the server at ${BACKEND_URL}. Please check your connection and ensure the backend server is running.`);
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setEndpoint('projects');
    setBatchSize(100);
    setForceRegenerate(false);
    setMaxItems('');
    setModelName('text-embedding-ada-002');
    setResult(null);
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <div className="embedding-insert-container">
      <h1 className="embedding-insert-title">Embedding Insertion</h1>
      <form onSubmit={handleSubmit} className="embedding-form">
        <div className="form-group">
          <label>
            Select Endpoint:
            <select
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
            >
              <option value="projects">Projects</option>
              <option value="questions">Questions</option>
              <option value="answers">Answers</option>
              <option value="all">All</option>
            </select>
          </label>
        </div>

        <div className="form-group">
          <label>
            Batch Size:
            <input
              type="number"
              value={batchSize}
              onChange={(e) => setBatchSize(parseInt(e.target.value, 10))}
              min="1"
              required
            />
          </label>
        </div>

        <div className="checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={forceRegenerate}
              onChange={(e) => setForceRegenerate(e.target.checked)}
            />
            Force Regenerate
          </label>
        </div>

        <div className="form-group">
          <label>
            Max Items (optional):
            <input
              type="number"
              value={maxItems}
              onChange={(e) => setMaxItems(e.target.value)}
              placeholder="Leave empty for no limit"
              min="1"
            />
          </label>
        </div>

        <div className="form-group">
          <label>
            Model Name:
            <input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              required
            />
          </label>
        </div>

        <div className="button-group">
          <button type="submit" disabled={loading} className="submit-button">
            {loading ? 'Processing...' : 'Submit'}
          </button>
          <button 
            type="button" 
            onClick={handleReset} 
            className="reset-button"
            disabled={loading}
          >
            Reset
          </button>
        </div>
      </form>

      {error && <p className="error-message">Error: {error}</p>}
      {successMessage && <p className="success-message">{successMessage}</p>}

      {result && (
        <div className="result-container">
          <h2 className="result-title">Result:</h2>
          <pre className="result-content">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default EmbeddingInsert;
