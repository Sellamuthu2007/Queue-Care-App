import React, { createContext, useState, useEffect, useContext } from 'react';
import { User } from '../types/user';
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
      const session = await authService.getSession();
      if (session?.user) {
        const u: User = {
          id: session.user.id,
          email: session.user.email || '',
          role: (session.user.user_metadata?.role as User['role']) || 'patient',
        };
        setUserState(u);
        setIsAuthenticated(true);
      } else {
        setUserState(null);
        setIsAuthenticated(false);
      }
    } catch {
      setUserState(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (accessToken: string, refreshToken: string, userData: User) => {
    setUserState(userData);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      await authService.logout();
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

    const { data: listener } = authService.onAuthStateChange((session) => {
      if (session?.user) {
        const u: User = {
          id: session.user.id,
          email: session.user.email || '',
          role: (session.user.user_metadata?.role as User['role']) || 'patient',
        };
        setUserState(u);
        setIsAuthenticated(true);
      } else {
        setUserState(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    return () => {
      listener?.subscription.unsubscribe();
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
