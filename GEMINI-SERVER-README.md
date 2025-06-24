# Gemini AI Personalization Server

This server enhances the database answers with personalized content using Google's Gemini AI model.

## Setup Instructions

1. First, make sure you have Node.js installed on your machine.

2. Create a folder for the Gemini server:
```bash
mkdir gemini-server
cd gemini-server
```

3. Copy the `gemini-server.js` and `gemini-server-package.json` files into this folder.

4. Rename the package file:
```bash
mv gemini-server-package.json package.json
```

5. Install the required dependencies:
```bash
npm install
```

6. Get a Gemini API key:
   - Go to https://ai.google.dev/
   - Create an account if necessary
   - Create a new API key
   - Copy the API key

7. Update the `gemini-server.js` file with your API key:
```javascript
const API_KEY = 'YOUR_GEMINI_API_KEY'; // Replace with your actual API key
```

## Running the Server

To start the server:

```bash
npm start
```

For development with auto-restart on file changes:

```bash
npm run dev
```

The Gemini AI server will run on port 3000 by default. You can change the port by setting the `PORT` environment variable.

## Endpoints

- `GET /health` - Health check endpoint
- `POST /personalize` - Main endpoint for personalizing responses

### Personalization Endpoint

**Request Body:**

```json
{
  "question": "User's original question",
  "originalAnswer": "Database answer to personalize",
  "userInfo": {
    "isAuthenticated": true,
    "otherUserInfo": "Any other relevant user information"
  }
}
```

**Response:**

```json
{
  "originalQuestion": "User's original question",
  "originalAnswer": "Database answer to personalize",
  "personalizedAnswer": "Enhanced personalized response from Gemini AI",
  "success": true
}
```

## Integrating with the Frontend

The widget.jsx file has been updated to:
1. Send the database answer to the Gemini AI server
2. Receive the personalized response
3. Display the personalized response to the user

If the Gemini AI server is unavailable, the widget will fall back to showing the original database answer.

## Customization

You can customize the prompt in the `gemini-server.js` file to change how Gemini personalizes the responses:

```javascript
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
``` 