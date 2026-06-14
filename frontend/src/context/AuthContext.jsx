import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('nexlink_token'));
  const [loading, setLoading] = useState(true);

  // Configure axios authorization headers
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('nexlink_token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('nexlink_token');
    }
  }, [token]);

  // Load user profile on mount if token exists
  useEffect(() => {
    const verifySession = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await axios.get('/auth/me');
        setUser(data);
      } catch (err) {
        console.error('Session verification failed, logging out...', err.message);
        // Clear token since it is invalid or expired
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, [token]);

  // Login action
  const login = async (email, password) => {
    try {
      const { data } = await axios.post('/auth/login', { email, password });
      setToken(data.token);
      setUser({
        id: data.id,
        name: data.name,
        email: data.email
      });
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Login failed. Please try again.';
      return { success: false, error: errorMsg };
    }
  };

  // Signup action
  const signup = async (name, email, password) => {
    try {
      const { data } = await axios.post('/auth/signup', { name, email, password });
      setToken(data.token);
      setUser({
        id: data.id,
        name: data.name,
        email: data.email
      });
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Signup failed. Please try again.';
      return { success: false, error: errorMsg };
    }
  };

  // Logout action
  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
