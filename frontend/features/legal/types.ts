export type LegalDocumentType = 'TermsOfService' | 'PrivacyPolicy';

export interface PendingDocumentDto {
  id: string;
  type: LegalDocumentType;
  version: string;
  contentPath: string;
  validFrom: string;
  createdAt: string;
}

export interface AcceptConsentsCommand {
  documentIds: string[];
}

export interface AcceptConsentsResult {
  success: boolean;
  accessToken: string;
}

export interface ConsentStatusResult {
  hasValidConsents: boolean;
}

/** Where the visitor made their cookie choice; mirrors the backend's CookieConsentSource. */
export type CookieConsentSource = 'Banner' | 'Preferences' | 'Account';

/** One cookie choice, as recorded by POST /api/legal/cookie-consent (proof of consent). */
export interface RecordCookieConsentCommand {
  consentId: string;
  analyticsGranted: boolean;
  adsGranted: boolean;
  source: CookieConsentSource;
  textVersion: string;
}
