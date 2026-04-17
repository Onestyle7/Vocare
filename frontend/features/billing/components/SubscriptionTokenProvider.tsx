'use client';

import React, { createContext, useContext } from 'react';

import { ACTIVE_SUBSCRIPTION_STATUSES } from '../constants';
import { SubscriptionStatuses } from '../types';

export interface TokenBalanceContextType {
  tokenBalance: number;
  subscriptionStatus: SubscriptionStatuses;
  hasActiveSubscription: boolean;
}

const TokenBalanceContext = createContext<TokenBalanceContextType>({
  tokenBalance: 0,
  subscriptionStatus: 'None',
  hasActiveSubscription: false,
});

export const TokenBalanceProvider = ({
  children,
  tokenBalance,
  subscriptionStatus,
}: {
  children: React.ReactNode;
  tokenBalance: number;
  subscriptionStatus: SubscriptionStatuses;
}) => {
  const hasActiveSubscription = ACTIVE_SUBSCRIPTION_STATUSES.includes(subscriptionStatus);

  return (
    <TokenBalanceContext.Provider
      value={{ tokenBalance, subscriptionStatus, hasActiveSubscription }}
    >
      {children}
    </TokenBalanceContext.Provider>
  );
};

export const useTokenBalanceContext = () => useContext(TokenBalanceContext);
