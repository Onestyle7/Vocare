'use server';

import { BillingType, CreateSubscriptionCommand } from './api';

export async function createCheckout(
  subscriptionType: BillingType,
  command: CreateSubscriptionCommand
) {}
