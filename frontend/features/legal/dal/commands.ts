'use server';

import { cookies } from 'next/headers';

import { invalidateUserTag } from '@/lib/tags';
import { actionErr, actionOk } from '@/lib/types/result';

import { AcceptConsentsCommand } from './api';
import { acceptLegalConsentsService } from './services';

export async function acceptLegalConsents(command: AcceptConsentsCommand) {
  const result = await acceptLegalConsentsService(command);

  return result.match(
    async (response) => {
      if (response.accessToken) {
        const cookieStore = await cookies();
        cookieStore.set('token', response.accessToken, {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
        });
      }
      await invalidateUserTag('legalConsents');
      return actionOk(response);
    },
    (error) => actionErr(error)
  );
}
