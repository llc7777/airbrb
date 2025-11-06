import { createContext, useState, useContext, useEffect } from "react";

// Create authentication context for global state management
const AuthContext = createContext(null);

/**
 * AuthProvider Component
 * Provides authentication state to entire application
 */
export const AuthProvider = ({ children }) => {
  // Initialize token from localStorage (persists login state on refresh)
  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || null;
  });

  // Login: Store token in state and localStorage
  const login = (newToken) => {
    setToken(newToken);
    localStorage.setItem("token", newToken);
  };

  // Logout: Remove token from state and localStorage
  const logout = () => {
    setToken(null);
    localStorage.removeItem("token");
  };

  // Context value to be provided
  const value = {
    token, // Current authentication token
    login, // Login function
    logout, // Logout function
    isAuthenticated: !!token, // Boolean indicating if user is authenticated
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * useAuth Hook
 * Custom hook to access authentication context
 * @throws Error if used outside AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
