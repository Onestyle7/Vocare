'use server';

import { invalidateUserTag } from '@/lib/tags';
import { actionErr, actionOk } from '@/lib/types/result';

import { AcceptConsentsCommand } from './api';
import { acceptLegalConsentsService } from './services';

export async function acceptLegalConsents(command: AcceptConsentsCommand) {
  const result = await acceptLegalConsentsService(command);

  return result.match(
    async (response) => {
      await invalidateUserTag('legalConsents');
      return actionOk(response);
    },
    (error) => actionErr(error)
  );
}
