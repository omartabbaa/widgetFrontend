import React, { useState } from 'react';
import { BACKEND_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import './FileUpload.css';

function FileUpload() {
  const { jwt, isAuthenticated } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [businessId, setBusinessId] = useState('');
  const [apiKey, setApiKey] = useState('eFOeIlZtQ0wTWbWnJhWUDLdXoW1tAshz');

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file type
      const allowedTypes = [
        'application/pdf',
        'text/plain',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a valid file type (PDF, DOC, DOCX, TXT, CSV, XLS, XLSX)');
        setSelectedFile(null);
        return;
      }
      
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        setSelectedFile(null);
        return;
      }
      
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    if (!businessId.trim()) {
      setError('Please enter a Business ID');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('businessId', businessId);

      console.log('📤 Starting file upload...');
      console.log('📁 File:', selectedFile.name);
      console.log('🏢 Business ID:', businessId);

      const response = await fetch(`${BACKEND_URL}/api/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'X-API-KEY': apiKey
        },
        body: formData
      });

      console.log('📥 Upload response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Upload failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Upload successful:', data);
      
      setResult(data);
      setUploadProgress(100);
      
      // If the backend returns generated questions, display them
      if (data.generatedQuestions && data.generatedQuestions.length > 0) {
        console.log('📝 Generated questions:', data.generatedQuestions);
      }

    } catch (err) {
      console.error('❌ Upload error:', err);
      setError(err.message || 'Failed to upload file');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setUploading(false);
    setUploadProgress(0);
    setResult(null);
    setError(null);
    setBusinessId('');
  };

  return (
    <div className="file-upload-container">
      <h1 className="file-upload-title">Document Upload & Question Generation</h1>
      
      <div className="upload-section">
        <div className="form-group">
          <label htmlFor="businessId">Business ID:</label>
          <input
            id="businessId"
            type="text"
            value={businessId}
            onChange={(e) => setBusinessId(e.target.value)}
            placeholder="Enter your Business ID"
            className="business-id-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="fileInput">Select Document:</label>
          <input
            id="fileInput"
            type="file"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
            className="file-input"
          />
          {selectedFile && (
            <div className="file-info">
              <p>Selected: {selectedFile.name}</p>
              <p>Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          )}
        </div>

        <div className="button-group">
          <button
            onClick={handleUpload}
            disabled={uploading || !selectedFile || !businessId.trim()}
            className="upload-button"
          >
            {uploading ? 'Uploading...' : 'Upload & Generate Questions'}
          </button>
          <button
            onClick={handleReset}
            disabled={uploading}
            className="reset-button"
          >
            Reset
          </button>
        </div>

        {uploading && (
          <div className="progress-section">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p>Processing document and generating questions...</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && (
          <div className="result-section">
            <h3>Upload Results</h3>
            <div className="result-details">
              <p><strong>Status:</strong> {result.status || 'Success'}</p>
              <p><strong>Document ID:</strong> {result.documentId || 'N/A'}</p>
              <p><strong>Questions Generated:</strong> {result.generatedQuestions?.length || 0}</p>
              
              {result.generatedQuestions && result.generatedQuestions.length > 0 && (
                <div className="questions-list">
                  <h4>Generated Questions:</h4>
                  <ul>
                    {result.generatedQuestions.map((question, index) => (
                      <li key={index}>{question}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {result.message && (
                <p><strong>Message:</strong> {result.message}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FileUpload; 