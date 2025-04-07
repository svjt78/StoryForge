// components/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);

  // Check local storage on load
  useEffect(() => {
    const savedToken = localStorage.getItem('jwtToken');
    const savedUserId = localStorage.getItem('userId');
    if (savedToken && savedUserId) {
      setToken(savedToken);
      setUserId(savedUserId);
      setIsAuthenticated(true);
    }
  }, []);

  const loginSuccess = (jwtToken, id) => {
    setToken(jwtToken);
    setUserId(id);
    setIsAuthenticated(true);
    localStorage.setItem('jwtToken', jwtToken);
    localStorage.setItem('userId', id);
  };

  const logout = () => {
    setToken(null);
    setUserId(null);
    setIsAuthenticated(false);
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('userId');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, userId, loginSuccess, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
