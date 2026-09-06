import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { MockService } from '../services/mockService';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => void;
  updateUser: (user: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local storage for session
    const stored = localStorage.getItem('auth_session');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      } catch (e) {
        localStorage.removeItem('auth_session');
      }
    }
    setIsLoading(false);
  }, []);

  const signIn = async (email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Validate against the "Database"
      const validUser = await MockService.validateUser(email, pass);
      
      if (validUser) {
        setUser(validUser);
        localStorage.setItem('auth_session', JSON.stringify(validUser));
        
        // Log the login action
        await MockService.addAuditLog({
          id: `log-${Date.now()}`,
          action: 'LOGIN',
          user: validUser.fullName,
          timestamp: new Date().toISOString(),
          details: 'Successful Login'
        });
        
        setIsLoading(false);
        return true;
      } else {
        setIsLoading(false);
        return false;
      }
    } catch (e) {
      console.error(e);
      setIsLoading(false);
      return false;
    }
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('auth_session');
  };

  const updateUser = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    localStorage.setItem('auth_session', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};