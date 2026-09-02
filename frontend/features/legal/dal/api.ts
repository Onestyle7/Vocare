import { ApiClient } from '@/lib/api/api-client';
import env from '@/lib/env/server';

export const legalApiClient = new ApiClient({
  baseUrl: `${env.API_BASE_URL}/legal`,
});

export type {
  AcceptConsentsCommand,
  ConsentStatusResult,
  LegalDocumentType,
  PendingDocumentDto,
} from '../types';
