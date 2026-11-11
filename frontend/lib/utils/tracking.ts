import { getCookie } from '@/lib/utils';
import { ADS_CONSENT_KEY } from '@/lib/utils/consent';

// Set by the OAuth callback for a newly created account, cleared by OAuthRegistrationTracker
export const NEW_OAUTH_USER_COOKIE = 'new_oauth_user';

export type ConversionEvent =
  | 'CompleteRegistration'
  | 'Download'
  | 'InitiateCheckout'
  | 'Purchase'
  | 'StartTrial'
  | 'ViewContent';

/** What was bought; each pixel receives it in its own parameter format. */
export type ConversionDetails = {
  id: string;
  name: string;
  value: number;
  currency: string;
};

/**
 * Reports a conversion to the TikTok and Meta pixels. Until the visitor decides about advertising
 * cookies the event only waits in the page's memory, and it leaves the browser only if they accept.
 */
export function trackConversion(event: ConversionEvent, details?: ConversionDetails): void {
  if (getCookie(ADS_CONSENT_KEY) === 'denied') return;

  window.ttq?.track(
    event,
    details && {
      contents: [{ content_id: details.id, content_type: 'product', content_name: details.name }],
      value: details.value,
      currency: details.currency,
    }
  );

  // Meta has no standard event for downloads
  window.fbq?.(
    event === 'Download' ? 'trackCustom' : 'track',
    event,
    details && {
      content_ids: [details.id],
      content_type: 'product',
      content_name: details.name,
      value: details.value,
      currency: details.currency,
    }
  );
}
