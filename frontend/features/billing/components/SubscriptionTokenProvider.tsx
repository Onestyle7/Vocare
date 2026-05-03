'use client';

import React, { createContext, useContext } from 'react';

interface TokenBalanceContextType {
  tokenBalance: number;
  subscriptionStatus: 'None' | 'Active' | 'Trialing' | 'Cancelled' | 'PastDue';
}

const TokenBalanceContext = createContext<TokenBalanceContextType>({
  tokenBalance: 0,
  subscriptionStatus: 'None',
});

export const TokenBalanceProvider = ({
  children,
  tokenBalance,
  subscriptionStatus,
}: {
  children: React.ReactNode;
} & TokenBalanceContextType) => {
  return (
    <TokenBalanceContext.Provider value={{ tokenBalance, subscriptionStatus }}>
      {children}
    </TokenBalanceContext.Provider>
  );
};

export const useTokenBalanceContext = () => useContext(TokenBalanceContext);
