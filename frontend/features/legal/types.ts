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

export interface ConsentStatusResult {
  hasValidConsents: boolean;
}
