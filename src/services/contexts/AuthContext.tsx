// src/contexts/AuthContext.tsx
import { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../../services/authService';
import type { UserProfile, RegisterData } from '../../services/authService';

// Type definition for AuthContext value
interface AuthContextType {
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// تعریف تایپ برای props کامپوننت AuthProvider
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Security fix (C-4): there is no localStorage token to peek at
    // anymore. The HttpOnly cookie is the only auth artifact, and the
    // only way to validate it is to call the backend. We always call
    // /accounts/users/me/ on mount — a 2xx means we're authenticated,
    // a 401 means we aren't. The backend sends the cookie
    // automatically; we don't read it.
    const initializeAuth = async () => {
      try {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      } catch {
        // Not authenticated or cookie expired; user stays null.
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    await authService.login({ email, password });
    const userData = await authService.getCurrentUser();
    setUser(userData);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    // Navigation is handled by the UI (nav button / ProtectedRoute)
  };

  const register = async (userData: RegisterData) => {
    await authService.register(userData);
    // The backend sets the auth cookies on the register response, so
    // we can immediately load the profile. No localStorage read/write.
    const userDataProfile = await authService.getCurrentUser();
    setUser(userDataProfile);
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    register,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
