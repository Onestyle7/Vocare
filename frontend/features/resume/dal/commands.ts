'use server';

import { invalidateUserTag } from '@/lib/tags';
import { actionErr, actionOk } from '@/lib/types/result';

import { CreateCvDto, UpdateCvDto } from './api';
import { createCvService, deleteCvService, updateCvService } from './services';

export async function createCvCommand(payload: CreateCvDto) {
  const result = await createCvService(payload);

  return result.match(
    async (response) => {
      await invalidateUserTag(['userCvs', 'cvLimits', 'subscriptionStatus']);
      return actionOk(response);
    },
    (error) => actionErr(error)
  );
}

export async function deleteCvCommand(cvId: string) {
  const result = await deleteCvService(cvId);

  return result.match(
    async (response) => {
      await invalidateUserTag('userCvs');
      return actionOk(response);
    },
    (error) => actionErr(error)
  );
}

export async function updateCvCommand(payload: UpdateCvDto) {
  const result = await updateCvService(payload);

  return result.match(
    async (response) => {
      await invalidateUserTag('userCvs');
      return actionOk(response);
    },
    (error) => actionErr(error)
  );
}
