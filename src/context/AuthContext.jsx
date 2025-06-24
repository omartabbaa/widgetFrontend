import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [jwt, setJwt] = useState(localStorage.getItem('jwt'));
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('jwt'));

  const login = (token) => {
    localStorage.setItem('jwt', token);
    setJwt(token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('jwt');
    setJwt(null);
    setIsAuthenticated(false);
  };

  // Update auth state if localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('jwt');
      setJwt(token);
      setIsAuthenticated(!!token);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <AuthContext.Provider value={{ jwt, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 