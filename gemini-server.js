const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize the app
const app = express();
const PORT = process.env.PORT || 3000;

// Add your Gemini API key here
const API_KEY = 'YOUR_GEMINI_API_KEY'; // Replace with your actual API key
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Gemini AI server is running' });
});

// Main personalization endpoint
app.post('/personalize', async (req, res) => {
  try {
    const { question, originalAnswer, userInfo } = req.body;
    
    if (!question || !originalAnswer) {
      return res.status(400).json({ 
        error: 'Missing required parameters. Please provide question and originalAnswer.'
      });
    }

    const prompt = `
      You are a helpful AI assistant that personalizes responses to user questions.
      
      Original question: "${question}"
      Current database answer: "${originalAnswer}"
      
      User information: ${userInfo ? JSON.stringify(userInfo) : 'No specific user information available'}
      
      Please rewrite the database answer to:
      1. Make it more conversational and friendly
      2. Add more relevant details if the answer seems too brief
      3. Format the response for better readability
      4. Keep the essential information from the original answer
      5. Maintain factual accuracy - don't invent information not in the original answer
      
      Your personalized response:
    `;

    const result = await model.generateContent(prompt);
    const personalized = result.response.text();
    
    console.log('📝 Personalized response created');
    
    return res.json({
      originalQuestion: question,
      originalAnswer: originalAnswer,
      personalizedAnswer: personalized,
      success: true
    });
  } catch (error) {
    console.error('Error generating personalized response:', error);
    return res.status(500).json({
      error: 'Failed to generate personalized response',
      details: error.message
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🤖 Gemini AI server running on port ${PORT}`);
  console.log(`🔗 Health check available at http://localhost:${PORT}/health`);
  console.log(`🔗 Personalization endpoint available at http://localhost:${PORT}/personalize`);
}); 