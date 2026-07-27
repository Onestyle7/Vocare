// Declaration for Google gtag function
export type ConsentState = 'granted' | 'denied';

export interface GtagConsentParams {
  analytics_storage?: ConsentState;
  ad_storage?: ConsentState;
  ad_user_data?: ConsentState;
  ad_personalization?: ConsentState;
  [key: string]: unknown;
}

export type GtagFunction = {
  (command: 'consent', action: 'default' | 'update', params: GtagConsentParams): void;
  (command: 'config', targetId: string, config?: Record<string, unknown>): void;
  (command: 'event', eventName: string, eventParams?: Record<string, unknown>): void;
  (command: string, ...args: unknown[]): void;
};

interface Window {
  dataLayer?: unknown[];
  gtag?: GtagFunction;
}
