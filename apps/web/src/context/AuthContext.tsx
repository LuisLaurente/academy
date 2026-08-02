import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { setAuthToken, removeAuthToken } from '@/config/api-client';

interface UserInfo {
  email: string;
  userId: string;
  role: string;
}

interface AuthContextType {
  user: UserInfo | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: UserInfo, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load persisted auth on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('learning_os_user');
      const storedToken = localStorage.getItem('learning_os_token');
      if (storedUser && storedToken) {
        try {
          const parsedUser = JSON.parse(storedUser) as UserInfo;
          setUser(parsedUser);
          setToken(storedToken);
          setAuthToken(storedToken);
        } catch (e) {
          console.error('Failed to parse stored user', e);
          localStorage.removeItem('learning_os_user');
          localStorage.removeItem('learning_os_token');
          removeAuthToken();
        }
      }
      setIsLoading(false);
    }
  }, []);

  const login = (userInfo: UserInfo, authToken: string) => {
    setUser(userInfo);
    setToken(authToken);
    setAuthToken(authToken);
    if (typeof window !== 'undefined') {
      localStorage.setItem('learning_os_user', JSON.stringify(userInfo));
      localStorage.setItem('learning_os_token', authToken);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    removeAuthToken();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('learning_os_user');
      localStorage.removeItem('learning_os_token');
    }
  };

  const isAuthenticated = !isLoading && !!user && !!token;

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

