'use server';

import { cookies } from 'next/headers';

import { AUTH_COOKIE_OPTIONS } from '@/features/auth/auth-cookie';
import { invalidateUserTag } from '@/lib/tags';
import { actionErr, actionOk } from '@/lib/types/result';

import { AcceptConsentsCommand } from './api';
import { acceptLegalConsentsService } from './services';

export async function acceptLegalConsents(command: AcceptConsentsCommand) {
  const result = await acceptLegalConsentsService(command);

  return result.match(
    async (response) => {
      if (!response.accessToken) {
        return actionErr({
          type: 'GenericApiError',
          message: 'Nie udało się odświeżyć sesji po zapisaniu zgód.',
        } as const);
      }

      const cookieStore = await cookies();
      cookieStore.set('token', response.accessToken, AUTH_COOKIE_OPTIONS);
      await invalidateUserTag('legalConsents');
      return actionOk({ success: response.success });
    },
    (error) => actionErr(error)
  );
}
