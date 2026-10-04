'use client';

import { createContext, ReactNode, useContext } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({ isAuthenticated: false });

export function AuthProvider({
  isAuthenticated = false,
  children,
}: {
  isAuthenticated?: boolean;
  children: ReactNode;
}) {
  return <AuthContext.Provider value={{ isAuthenticated }}>{children}</AuthContext.Provider>;
}

export const useAuthContext = () => useContext(AuthContext);
