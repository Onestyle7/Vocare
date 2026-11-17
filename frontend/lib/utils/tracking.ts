import type { OAuthProvider } from '@/features/auth/oauth/providers';
import type { PromoPlacement, PromoVariant } from '@/features/marketing/constants/promo';
import { getCookie } from '@/lib/utils';
import { ADS_CONSENT_KEY, getAnalyticsConsent } from '@/lib/utils/consent';

/** What was bought; each pixel receives it in its own parameter format. */
export type ProductDetails = {
  id: string;
  name: string;
  value: number;
  currency: string;
  // Stripe Checkout session ID of a completed checkout. Becomes the event ID and GA4's
  // transaction_id, so the same purchase is counted once, also against a later server-side copy.
  transactionId?: string;
};

export type ToolName = 'salary_calculator';

export type SignUpMethod = 'email' | OAuthProvider;

// Which promo (PromoSticky) the visitor acted on, and where it was shown
type PromoDetails = { variant: PromoVariant; placement: PromoPlacement };

// Event names follow the TikTok and Meta standard events wherever one exists
type EventDetails = {
  CompleteRegistration: { method: SignUpMethod };
  // CV export to PDF: the print dialog opened (the browser can't tell whether the file was saved)
  Download: undefined;
  InitiateCheckout: ProductDetails;
  // Click on a promo's main button, on the blog and the salary calculator
  PromoClick: PromoDetails;
  PromoDismiss: PromoDetails;
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
  Download: 'cv_export',
  InitiateCheckout: 'begin_checkout',
  PromoClick: 'promo_click',
  PromoDismiss: 'promo_dismiss',
  Purchase: 'purchase',
  StartTrial: 'start_trial',
  ToolUsed: 'tool_used',
  ViewContent: null,
};

// Meta has no standard event for these
const META_CUSTOM_EVENTS = new Set<TrackedEvent>(['Download', 'PromoClick', 'ToolUsed']);

// Of no use to the ad platforms, so they don't get them
const GA4_ONLY_EVENTS = new Set<TrackedEvent>(['PromoDismiss']);

function createEventId(): string {
  // randomUUID exists only on HTTPS and localhost
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isProduct(details: NonNullable<Details>): details is ProductDetails {
  return 'currency' in details;
}

// Events other than purchases carry their few parameters to every tool under the same names
function toSharedParams(details: Exclude<NonNullable<Details>, ProductDetails>): Params {
  if ('toolName' in details) return { tool_name: details.toolName };
  if ('method' in details) return { method: details.method };
  return { promo_variant: details.variant, promo_placement: details.placement };
}

function toGa4Params(event: TrackedEvent, details: Details, eventId: string): Params {
  if (!details) return {};
  if (!isProduct(details)) return toSharedParams(details);

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
  if (!isProduct(details)) return toSharedParams(details);

  return {
    contents: [{ content_id: details.id, content_type: 'product', content_name: details.name }],
    value: details.value,
    currency: details.currency,
  };
}

function toMetaParams(details: Details): Params {
  if (!details) return {};
  if (!isProduct(details)) return toSharedParams(details);

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
 * Google Analytics gets the event only with analytics consent. Before that its script isn't loaded,
 * and an event from that time is dropped rather than kept for later. The pixels respect the
 * advertising consent: until the visitor decides, the event only waits in the page's memory, and
 * it leaves the browser only if they accept.
 */
export function trackEvent<E extends TrackedEvent>(event: E, ...args: DetailsArgs<E>): void {
  const details = args[0] as Details;
  const eventId =
    (details && 'transactionId' in details && details.transactionId) || createEventId();

  const ga4Event = GA4_EVENT_NAMES[event];
  if (ga4Event && getAnalyticsConsent()) {
    window.gtag?.('event', ga4Event, toGa4Params(event, details, eventId));
  }

  if (GA4_ONLY_EVENTS.has(event) || getCookie(ADS_CONSENT_KEY) === 'denied') return;

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
