'use client';

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import { getCookie } from '@/lib/utils';

interface AuthContextType {
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({ isAuthenticated: false });

export function AuthProvider({
  isAuthenticated: initialIsAuthenticated,
  children,
}: {
  isAuthenticated?: boolean;
  children: ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof initialIsAuthenticated === 'boolean') {
      return initialIsAuthenticated;
    }
    return false;
  });

  useEffect(() => {
    if (typeof initialIsAuthenticated === 'boolean') {
      setIsAuthenticated(initialIsAuthenticated);
      return;
    }
    const hasAuthCookie = getCookie('is_authenticated') === '1';
    setIsAuthenticated(hasAuthCookie);
  }, [initialIsAuthenticated]);

  return <AuthContext.Provider value={{ isAuthenticated }}>{children}</AuthContext.Provider>;
}

export const useAuthContext = () => useContext(AuthContext);
