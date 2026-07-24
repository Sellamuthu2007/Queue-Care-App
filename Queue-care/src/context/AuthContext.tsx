import React, { createContext, useState, useEffect, useContext } from 'react';
import { User } from '../types/user';
import * as secureStorage from '../storage/secureStorage';
import * as authService from '../services/authService';

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
      const token = await secureStorage.getAccessToken();
      const u = await secureStorage.getUser();
      if (token && u) {
        setUserState(u);
        setIsAuthenticated(true);
      } else {
        await secureStorage.clearTokens();
        setUserState(null);
        setIsAuthenticated(false);
      }
    } catch {
      await secureStorage.clearTokens();
      setUserState(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (accessToken: string, refreshToken: string, userData: User) => {
    await secureStorage.saveAccessToken(accessToken);
    await secureStorage.saveRefreshToken(refreshToken);
    await secureStorage.saveUser(userData);
    setUserState(userData);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      const rt = await secureStorage.getRefreshToken();
      if (rt) {
        await authService.logout(rt).catch(() => {});
      }
    } finally {
      await secureStorage.clearTokens();
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

    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      const handleLogout = () => {
        setUserState(null);
        setIsAuthenticated(false);
      };
      window.addEventListener('auth-logout', handleLogout);
      return () => {
        window.removeEventListener('auth-logout', handleLogout);
      };
    }
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
