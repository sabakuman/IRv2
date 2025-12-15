import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  signIn: (role: UserRole) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_USER: UserProfile = {
  id: 'u-1',
  email: 'official@mohre.gov.ae',
  fullName: 'Ahmed Al-Mansouri',
  role: 'admin',
  avatarUrl: 'https://ui-avatars.com/api/?name=Ahmed+Al-Mansouri&background=0D8ABC&color=fff'
};

const STANDARD_USER: UserProfile = {
  id: 'u-2',
  email: 'sarah.k@mohre.gov.ae',
  fullName: 'Sarah Khan',
  role: 'user',
  avatarUrl: 'https://ui-avatars.com/api/?name=Sarah+Khan&background=eb4034&color=fff'
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check local storage for session
    const stored = localStorage.getItem('auth_session');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setIsLoading(false);
  }, []);

  const signIn = async (role: UserRole) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const selectedUser = role === 'admin' ? ADMIN_USER : STANDARD_USER;
    
    setUser(selectedUser);
    localStorage.setItem('auth_session', JSON.stringify(selectedUser));
    setIsLoading(false);
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('auth_session');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};