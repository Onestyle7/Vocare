'use client';

import { createContext, ReactNode, useContext } from 'react';

interface AuhtContextType {
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuhtContextType>({ isAuthenticated: false });

export function AuthProvider({
  isAuthenticated,
  children,
}: {
  isAuthenticated: boolean;
  children: ReactNode;
}) {
  return <AuthContext.Provider value={{ isAuthenticated }}>{children}</AuthContext.Provider>;
}

export const useAuthContext = () => useContext(AuthContext);
