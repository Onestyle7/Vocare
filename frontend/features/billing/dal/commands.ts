'use server';

import { redirect } from 'next/navigation';

import { invalidateUserTag } from '@/lib/tags';
import { actionErr, actionOk } from '@/lib/types/result';

import { BillingType, CreateSubscriptionCommand } from './api';
import {
  cancelSubscriptionService,
  createSubscriptionService,
  getCustomerPortalService,
} from './services';

export async function createCheckout(
  subscriptionType: BillingType,
  command: CreateSubscriptionCommand
) {
  const result = await createSubscriptionService(subscriptionType, command);
  return result.match(
    async (result) => {
      await invalidateUserTag('subscriptionStatus');
      redirect(result.url);
    },
    (error) => actionErr(error)
  );
}

export async function getCustomerPortalUrl() {
  const result = await getCustomerPortalService();

  return result.match(
    (response) => {
      redirect(response.url);
    },
    (error) => actionErr(error)
  );
}

export async function cancelSubscriptionCommand() {
  const result = await cancelSubscriptionService();

  return result.match(
    async (response) => {
      await invalidateUserTag('subscriptionStatus');
      return actionOk(response);
    },
    (error) => actionErr(error)
  );
}
