import { createContext, useState, useContext } from "react";

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

  // User email state (also persisted in localStorage)
  const [userEmail, setUserEmail] = useState(() => {
    return localStorage.getItem("userEmail") || null;
  });

  // Login: Store token and email in localStorage and context
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

  // Context value to be provided
  const value = {
    token, // Current authentication token
    userEmail, // Current user's email
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
