import React, { createContext, useState, useContext } from 'react';

const PersonalizedAnswerContext = createContext(null);

export const PersonalizedAnswerProvider = ({ children }) => {
  const [personalizedAnswers, setPersonalizedAnswers] = useState([]);
  const [latestPersonalizedAnswer, setLatestPersonalizedAnswer] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [personalizationError, setPersonalizationError] = useState(null);

  // Add a personalized answer to the list
  const addPersonalizedAnswer = (answer) => {
    console.log("✅ Adding personalized answer to context:", answer);
    setPersonalizedAnswers(prev => [...prev, answer]);
    setLatestPersonalizedAnswer(answer);
  };

  // Clear all personalized answers
  const clearPersonalizedAnswers = () => {
    setPersonalizedAnswers([]);
    setLatestPersonalizedAnswer(null);
  };

  return (
    <PersonalizedAnswerContext.Provider value={{
      personalizedAnswers,
      latestPersonalizedAnswer,
      isProcessing,
      personalizationError,
      setIsProcessing,
      setPersonalizationError,
      addPersonalizedAnswer,
      clearPersonalizedAnswers
    }}>
      {children}
    </PersonalizedAnswerContext.Provider>
  );
};

export const usePersonalizedAnswer = () => {
  const context = useContext(PersonalizedAnswerContext);
  if (!context) {
    throw new Error('usePersonalizedAnswer must be used within a PersonalizedAnswerProvider');
  }
  return context;
}; 