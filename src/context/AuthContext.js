'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '@/services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      if (authService.isAuthenticated()) {
        // Try to get stored user info, or validate the token
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          // If no stored user but we have a token, clear and require re-login
          authService.clearTokens();
        }
      }
    } catch (error) {
      authService.clearTokens();
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }

  async function login(username, password) {
    const userData = await authService.login(username, password);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }

  async function register(username, email, password) {
    const userData = await authService.register(username, email, password);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }

  async function logout() {
    await authService.logout();
    localStorage.removeItem('user');
    setUser(null);
  }

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
