import React, { useState } from 'react';
import './EmbeddingButton.css';

const BACKEND_URL = "http://localhost:8081";

const EmbeddingButton = ({ apiKey }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleEmbeddingProcess = async () => {
    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/embeddings/process-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': apiKey
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to process embeddings');
      }

      setResult({
        processedCount: data.processedCount,
        errorCount: data.errorCount,
        processingTime: data.processingTime,
        message: data.message
      });
    } catch (err) {
      console.error('Error processing embeddings:', err);
      setError(err.message || 'An error occurred while processing embeddings');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="embedding-button-container">
      <button 
        className="embedding-button"
        onClick={handleEmbeddingProcess}
        disabled={isProcessing}
      >
        {isProcessing ? 'Processing Embeddings...' : 'Process Embeddings'}
      </button>

      {error && (
        <div className="embedding-error">
          {error}
        </div>
      )}

      {result && (
        <div className="embedding-result">
          <h4>Processing Complete</h4>
          <p>Processed Items: {result.processedCount}</p>
          <p>Errors: {result.errorCount}</p>
          <p>Processing Time: {(result.processingTime / 1000).toFixed(2)}s</p>
          <p>{result.message}</p>
        </div>
      )}
    </div>
  );
};

export default EmbeddingButton; 