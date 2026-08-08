import React, { createContext, useState, useEffect, useContext } from 'react';
import { User } from '../types/user';
import * as authService from '../services/authService';
import * as secureStorage from '../storage/secureStorage';
import { invalidateAuthSession, refreshSession, isAccessTokenExpired } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initializeAuth: () => Promise<void>;
  login: (accessToken: string, refreshToken: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      const savedUser = await secureStorage.getUser();
      const token = await secureStorage.getAccessToken();
      const refreshToken = await secureStorage.getRefreshToken();

      if (!savedUser || !token) {
        await secureStorage.clearTokens();
        setUserState(null);
        setIsAuthenticated(false);
        return;
      }

      if (isAccessTokenExpired(token)) {
        if (!refreshToken) {
          await secureStorage.clearTokens();
          setUserState(null);
          setIsAuthenticated(false);
          return;
        }

        try {
          await refreshSession();
          setUserState(savedUser);
          setIsAuthenticated(true);
          return;
        } catch {
          await secureStorage.clearTokens();
          setUserState(null);
          setIsAuthenticated(false);
          return;
        }
      }

      setUserState(savedUser);
      setIsAuthenticated(true);
    } catch {
      await secureStorage.clearTokens();
      setUserState(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (accessToken: string, refreshToken: string, userData: User) => {
    try {
      await secureStorage.saveAccessToken(accessToken);
      await secureStorage.saveRefreshToken(refreshToken);
      await secureStorage.saveUser(userData);
      setUserState(userData);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Error saving session to secure storage:', err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      invalidateAuthSession();
      await authService.logout();
      await secureStorage.clearTokens();
    } catch (err) {
      console.error('Error clearing session from secure storage:', err);
    } finally {
      setUserState(null);
      setIsAuthenticated(false);
    }
  };

  const setUser = (u: User | null) => {
    setUserState(u);
    setIsAuthenticated(!!u);
  };

  useEffect(() => {
    initializeAuth();

    // Listen to custom dispatch event for network interceptor signout redirects
    const handleAuthLogout = () => {
      invalidateAuthSession();
      setUserState(null);
      setIsAuthenticated(false);
    };

    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('auth-logout', handleAuthLogout);
    }

    return () => {
      if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
        window.removeEventListener('auth-logout', handleAuthLogout);
      }
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        initializeAuth,
        login,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
