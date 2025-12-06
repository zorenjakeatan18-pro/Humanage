// context/AuthContext.jsx - FIXED VERSION with API Integration
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Verify token with backend
        const response = await authAPI.getMe();
        if (response.success) {
          setUser(response.user);
          setIsAuthenticated(true);
        } else {
          // Token invalid, clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  // Login function - connects to backend
  const login = async (email, password) => {
    try {
      setLoading(true);
      
      // Call backend API
      const response = await authAPI.login(email, password);

      if (response.success) {
        // Store token and user data
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        setUser(response.user);
        setIsAuthenticated(true);
        
        return { success: true, user: response.user };
      } else {
        return { success: false, error: response.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to connect to server. Please check if backend is running.' 
      };
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      
      const response = await authAPI.register(userData);

      if (response.success) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        setUser(response.user);
        setIsAuthenticated(true);
        
        return { success: true, user: response.user };
      } else {
        return { success: false, error: response.message };
      }
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  // Update user profile - connects to backend
  const updateProfile = async (updatedData) => {
    try {
      const response = await authAPI.updateProfile(updatedData);
      
      if (response.success) {
        const updatedUser = response.user;
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        return { success: true, user: updatedUser };
      } else {
        return { success: false, error: response.message };
      }
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: error.message };
    }
  };

  // Update settings
  const updateSettings = (settings) => {
    const currentSettings = JSON.parse(localStorage.getItem('settings') || '{}');
    const newSettings = { ...currentSettings, ...settings };
    localStorage.setItem('settings', JSON.stringify(newSettings));
    return { success: true, settings: newSettings };
  };

  // Get settings
  const getSettings = () => {
    return JSON.parse(localStorage.getItem('settings') || '{}');
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateProfile,
    updateSettings,
    getSettings
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};