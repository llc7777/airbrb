import { useState, useEffect } from "react";

/**
 * useAuth Hook
 * Custom hook for authentication state management
 * Manages token and user email in localStorage
 */
export const useAuth = () => {
  // Initialize token from localStorage (persists login state on refresh)
  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || null;
  });

  // User email state (also persisted in localStorage)
  const [userEmail, setUserEmail] = useState(() => {
    return localStorage.getItem("userEmail") || null;
  });

  // Login: Store token and email in localStorage and state
  const login = (newToken, email) => {
    setToken(newToken);
    localStorage.setItem("token", newToken);
    setUserEmail(email);
    localStorage.setItem("userEmail", email);
  };

  // Logout: Remove token and email from state and localStorage
  const logout = () => {
    setToken(null);
    setUserEmail(null);
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
  };

  // Return authentication state and methods
  return {
    token, // Current authentication token
    userEmail, // Current user's email
    login, // Login function
    logout, // Logout function
    isAuthenticated: !!token, // Boolean indicating if user is authenticated
  };
};
