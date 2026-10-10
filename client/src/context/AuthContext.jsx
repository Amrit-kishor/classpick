import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [faculty, setFaculty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const data = await authService.getMe();
      setFaculty(data.faculty);
      setError(null);
    } catch (err) {
      setFaculty(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (credentials) => {
    setError(null);
    try {
      const data = await authService.login(credentials);
      setFaculty(data.faculty);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const data = await authService.register(userData);
      setFaculty(data.faculty);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setFaculty(null);
    }
  };

  const updateProfile = async (profileData) => {
    const data = await authService.updateProfile(profileData);
    setFaculty(data.faculty);
    return data;
  };

  return (
    <AuthContext.Provider
      value={{
        faculty,
        loading,
        error,
        isAuthenticated: !!faculty,
        login,
        register,
        logout,
        updateProfile,
        refreshFaculty: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
