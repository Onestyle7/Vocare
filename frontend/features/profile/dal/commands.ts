'use server';

import { invalidateUserTag } from '@/lib/tags';
import { actionErr, actionOk } from '@/lib/types/result';

import { CreateProfileCommand, UpdateProfileCommand } from './api';
import {
  clearUserProfileService,
  createUserProfileService,
  importProfileFromCvService,
  updateUserProfileService,
} from './services';

export async function createProfileCommand(command: CreateProfileCommand) {
  const result = await createUserProfileService(command);

  return result.match(
    async (profile) => {
      await invalidateUserTag('userProfile');
      return actionOk(profile);
    },
    (error) => actionErr(error)
  );
}

export async function updateProfileCommand(command: UpdateProfileCommand) {
  const result = await updateUserProfileService(command);

  return result.match(
    async (response) => {
      await invalidateUserTag(['userProfile', 'profileStats']);
      return actionOk(response);
    },
    (error) => actionErr(error)
  );
}

export async function clearProfileCommand() {
  const result = await clearUserProfileService();

  return result.match(
    async (response) => {
      await invalidateUserTag(['userProfile', 'profileStats', 'profileAttributes']);
      return actionOk(response);
    },
    (error) => actionErr(error)
  );
}

export async function importProfileFromCvCommand(formData: FormData) {
  const result = await importProfileFromCvService(formData);

  return result.match(
    async (profile) => {
      await invalidateUserTag(['userProfile', 'profileStats']);
      return actionOk(profile);
    },
    (error) => actionErr(error)
  );
}
