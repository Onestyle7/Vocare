'use client';

import React, { createContext, useContext } from 'react';
import { useTokenBalance } from '../hooks/useTokenBalance';

type TokenBalanceContextType = ReturnType<typeof useTokenBalance>;

const TokenBalanceContext = createContext<TokenBalanceContextType | undefined>(undefined);

export const TokenBalanceProvider = ({ children }: { children: React.ReactNode }) => {
  const tokenState = useTokenBalance();

  return <TokenBalanceContext.Provider value={tokenState}>{children}</TokenBalanceContext.Provider>;
};

export const useTokenBalanceContext = () => {
  const context = useContext(TokenBalanceContext);
  if (!context) {
    throw new Error('useTokenBalanceContext must be used within a TokenBalanceProvider');
  }
  return context;
};
