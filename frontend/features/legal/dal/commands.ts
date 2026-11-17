'use server';

import { cookies } from 'next/headers';
import { z } from 'zod';

import { AUTH_COOKIE_OPTIONS } from '@/features/auth/auth-cookie';
import { COOKIE_CONSENT_TEXT_VERSION } from '@/features/marketing/constants/legal';
import { invalidateUserTag } from '@/lib/tags';
import { actionErr, actionOk } from '@/lib/types/result';
import { ADS_CONSENT_KEY, CONSENT_ID_COOKIE, COOKIE_CONSENT_KEY } from '@/lib/utils/consent';

import { AcceptConsentsCommand, CookieConsentSource } from './api';
import { acceptLegalConsentsService, recordCookieConsentService } from './services';

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

const cookieConsentSourceSchema = z.enum(['Banner', 'Preferences', 'Account']);
const consentIdSchema = z.string().uuid();

/**
 * Records the visitor's current cookie choices on the server, as proof of consent. Everything is
 * read from the request's cookies, which the browser has just updated, so the record matches
 * exactly what the tools follow. Without a valid consent ID nothing is sent.
 */
export async function recordCookieConsent(source: CookieConsentSource) {
  const parsedSource = cookieConsentSourceSchema.safeParse(source);
  const cookieStore = await cookies();
  const consentId = consentIdSchema.safeParse(cookieStore.get(CONSENT_ID_COOKIE)?.value);

  if (!parsedSource.success || !consentId.success) {
    return actionErr({
      type: 'GenericApiError',
      message: 'Nieprawidłowy zapis wyboru dotyczącego plików cookies.',
    } as const);
  }

  const result = await recordCookieConsentService({
    consentId: consentId.data,
    analyticsGranted: cookieStore.get(COOKIE_CONSENT_KEY)?.value === 'granted',
    adsGranted: cookieStore.get(ADS_CONSENT_KEY)?.value === 'granted',
    source: parsedSource.data,
    textVersion: COOKIE_CONSENT_TEXT_VERSION,
  });

  return result.match(
    () => actionOk({ success: true }),
    (error) => actionErr(error)
  );
}
