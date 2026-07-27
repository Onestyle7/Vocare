'use server';

import { invalidateUserTag } from '@/lib/tags';
import { actionErr, actionOk } from '@/lib/types/result';

import { CreateCvDto, GenerateCvFromProfileDto, UpdateCvDto } from './api';
import {
  createCvService,
  deleteCvService,
  GenerateCvFromProfileService,
  updateCvService,
} from './services';

export async function createCvCommand(payload: CreateCvDto) {
  const result = await createCvService(payload);

  return result.match(
    async (response) => {
      await invalidateUserTag(['userCvs', 'cvLimits', 'subscriptionStatus', 'profileStats']);
      return actionOk(response);
    },
    (error) => actionErr(error)
  );
}

export async function deleteCvCommand(cvId: string) {
  const result = await deleteCvService(cvId);
  await invalidateUserTag(['userCvs', 'cvLimits', 'profileStats']);

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
  await invalidateUserTag(['userCvs']);

  return result.match(
    async (response) => {
      await invalidateUserTag('userCvs');
      return actionOk(response);
    },
    (error) => actionErr(error)
  );
}

export async function GenerateCvFromProfileCommand(payload: GenerateCvFromProfileDto) {
  const result = await GenerateCvFromProfileService(payload);

  return result.match(
    async (response) => {
      await invalidateUserTag(['userCvs', 'cvLimits', 'subscriptionStatus', 'profileStats']);

      return actionOk(response);
    },
    (error) => actionErr(error)
  );
}
