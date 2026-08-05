'use server';

import { revalidateTag } from 'next/cache';

import { CACHE_TAGS, invalidateUserTag } from '@/lib/tags';
import { actionErr, actionOk } from '@/lib/types/result';

import { CreateCvDto, GenerateCvFromProfileDto, TailorCvDto, UpdateCvDto } from './api';
import {
  analyzeCvService,
  createCvService,
  deleteCvService,
  GenerateCvFromProfileService,
  getCvAnalysisService,
  getCvDetailsService,
  getCvLimitsService,
  tailorCvService,
  updateCvService,
} from './services';

export async function getCvDetailsCommand(cvId: string) {
  const result = await getCvDetailsService(cvId, { cache: 'no-store' });
  return result.match(
    (response) => actionOk(response),
    (error) => actionErr(error)
  );
}

export async function getCvLimitsCommand() {
  const result = await getCvLimitsService({ cache: 'no-store' });
  return result.match(
    (response) => actionOk(response),
    (error) => actionErr(error)
  );
}

export async function getCvAnalysisCommand(cvId: string) {
  const result = await getCvAnalysisService(cvId, { cache: 'no-store' });
  return result.match(
    (response) => actionOk(response),
    (error) => actionErr(error)
  );
}

export async function analyzeCvCommand(cvId: string) {
  const result = await analyzeCvService(cvId, { cache: 'no-store' });
  return result.match(
    async (response) => {
      await invalidateUserTag('subscriptionStatus');
      return actionOk(response);
    },
    (error) => actionErr(error)
  );
}

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

  return result.match(
    async (response) => {
      await invalidateUserTag(['userCvs', 'cvLimits', 'profileStats']);
      revalidateTag(CACHE_TAGS.cvDetails(cvId), { expire: 0 });
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
      revalidateTag(CACHE_TAGS.cvDetails(payload.id), { expire: 0 });
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
    async (error) => {
      // Generowanie zapisuje CV przed końcowym rozliczeniem tokenów. Przy błędzie
      // odświeżamy więc zarówno saldo, jak i listę/limit CV.
      await invalidateUserTag(['userCvs', 'cvLimits', 'subscriptionStatus', 'profileStats']);
      return actionErr(error);
    }
  );
}

export async function tailorCvCommand(payload: TailorCvDto) {
  const result = await tailorCvService(payload);

  return result.match(
    async (response) => {
      revalidateTag(CACHE_TAGS.cvDetails(response.id), { expire: 0 });
      await invalidateUserTag(['userCvs', 'subscriptionStatus']);

      return actionOk(response);
    },
    async (error) => {
      // Tailor zapisuje treść przed końcowym rozliczeniem tokenów, więc odpowiedź
      // błędna nie gwarantuje, że rekord pozostał niezmieniony.
      revalidateTag(CACHE_TAGS.cvDetails(payload.cvId), { expire: 0 });
      await invalidateUserTag(['userCvs', 'subscriptionStatus']);
      return actionErr(error);
    }
  );
}
