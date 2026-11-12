import { getCookie } from '@/lib/utils';
import { ADS_CONSENT_KEY } from '@/lib/utils/consent';

// Set by the OAuth callback for a newly created account, cleared by OAuthRegistrationTracker
export const NEW_OAUTH_USER_COOKIE = 'new_oauth_user';

/** What was bought; each pixel receives it in its own parameter format. */
export type ProductDetails = {
  id: string;
  name: string;
  value: number;
  currency: string;
};

export type ToolName = 'salary_calculator';

// Event names follow the TikTok and Meta standard events wherever one exists
type EventDetails = {
  CompleteRegistration: undefined;
  // CV PDF download
  Download: undefined;
  InitiateCheckout: ProductDetails;
  Purchase: ProductDetails;
  StartTrial: ProductDetails;
  ToolUsed: { toolName: ToolName };
  // Pricing page view
  ViewContent: undefined;
};

export type TrackedEvent = keyof EventDetails;

type Details = EventDetails[TrackedEvent];
type DetailsArgs<E extends TrackedEvent> = EventDetails[E] extends undefined
  ? []
  : [details: EventDetails[E]];
type Params = Record<string, unknown>;

// GA4 uses its own names; null where the automatic page_view already records the moment
const GA4_EVENT_NAMES: Record<TrackedEvent, string | null> = {
  CompleteRegistration: 'sign_up',
  Download: 'cv_download',
  InitiateCheckout: 'begin_checkout',
  Purchase: 'purchase',
  StartTrial: 'start_trial',
  ToolUsed: 'tool_used',
  ViewContent: null,
};

// Meta has no standard event for these
const META_CUSTOM_EVENTS = new Set<TrackedEvent>(['Download', 'ToolUsed']);

function createEventId(): string {
  // randomUUID exists only on HTTPS and localhost
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function toGa4Params(event: TrackedEvent, details: Details, eventId: string): Params {
  if (!details) return {};
  if ('toolName' in details) return { tool_name: details.toolName };

  return {
    currency: details.currency,
    value: details.value,
    items: [{ item_id: details.id, item_name: details.name, price: details.value, quantity: 1 }],
    // GA4 requires an ID for every purchase and counts each ID only once
    ...(event === 'Purchase' && { transaction_id: eventId }),
  };
}

function toTikTokParams(details: Details): Params {
  if (!details) return {};
  if ('toolName' in details) return { tool_name: details.toolName };

  return {
    contents: [{ content_id: details.id, content_type: 'product', content_name: details.name }],
    value: details.value,
    currency: details.currency,
  };
}

function toMetaParams(details: Details): Params {
  if (!details) return {};
  if ('toolName' in details) return { tool_name: details.toolName };

  return {
    content_ids: [details.id],
    content_type: 'product',
    content_name: details.name,
    value: details.value,
    currency: details.currency,
  };
}

/**
 * Reports an event to Google Analytics and to the TikTok and Meta pixels, all under one event ID,
 * so a copy sent later from the server can be deduplicated against it.
 *
 * Google Analytics follows Consent Mode, exactly like its page views. The pixels respect the
 * advertising consent: until the visitor decides, the event only waits in the page's memory, and
 * it leaves the browser only if they accept.
 */
export function trackEvent<E extends TrackedEvent>(event: E, ...args: DetailsArgs<E>): void {
  const details = args[0] as Details;
  const eventId = createEventId();

  const ga4Event = GA4_EVENT_NAMES[event];
  if (ga4Event) window.gtag?.('event', ga4Event, toGa4Params(event, details, eventId));

  if (getCookie(ADS_CONSENT_KEY) === 'denied') return;

  window.ttq?.track(event, toTikTokParams(details), { event_id: eventId });
  window.fbq?.(
    META_CUSTOM_EVENTS.has(event) ? 'trackCustom' : 'track',
    event,
    toMetaParams(details),
    {
      eventID: eventId,
    }
  );
}
