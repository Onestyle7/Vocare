import 'server-only';

import { Result } from 'neverthrow';
import { RequestInit } from 'next/dist/server/web/spec-extension/request';

import { BaseAppError } from '@/lib/types/result';

import {
  AcceptConsentsCommand,
  AcceptConsentsResult,
  ConsentStatusResult,
  legalApiClient,
  PendingDocumentDto,
} from './api';

export type LegalDomainError = BaseAppError<
  'Unauthorized' | 'EmptyDocumentsError' | 'DocumentNotFound'
>;

export async function getPendingLegalDocumentsService(
  requestOptions?: RequestInit
): Promise<Result<PendingDocumentDto[], LegalDomainError>> {
  const result = await legalApiClient.get<PendingDocumentDto[]>('/pending', requestOptions);

  return result
    .map((response) => response.data)
    .mapErr((error): LegalDomainError => {
      switch (error.type) {
        case 'UnauthorizedError': {
          return {
            type: 'Unauthorized',
            message: 'Musisz być zalogowany, aby pobrać listę dokumentów prawnych.',
            details: error.details,
          };
        }
        default: {
          return {
            type: 'GenericApiError',
            message: 'Wystąpił błąd podczas pobierania dokumentów prawnych.',
            details: error.details,
          };
        }
      }
    });
}

export async function acceptLegalConsentsService(
  command: AcceptConsentsCommand
): Promise<Result<AcceptConsentsResult, LegalDomainError>> {
  const result = await legalApiClient.post<AcceptConsentsResult>('/accept', command);

  return result
    .map((response) => response.data)
    .mapErr((error): LegalDomainError => {
      const errorCode = (error.details as Record<string, unknown> | undefined)?.errorCode;

      if (errorCode === 'EMPTY_CONSENT_DOCUMENTS') {
        return {
          type: 'EmptyDocumentsError',
          message: 'Lista dokumentów do akceptacji nie może być pusta.',
          details: error.details,
        };
      }

      if (errorCode === 'LEGAL_DOCUMENT_NOT_FOUND') {
        return {
          type: 'DocumentNotFound',
          message: 'Jeden z wymaganych dokumentów nie został odnaleziony.',
          details: error.details,
        };
      }

      switch (error.type) {
        case 'UnauthorizedError': {
          return {
            type: 'Unauthorized',
            message: 'Sesja wygasła. Zaloguj się ponownie.',
            details: error.details,
          };
        }
        case 'BadRequestError':
        case 'UnprocessableEntityError': {
          return {
            type: 'EmptyDocumentsError',
            message: 'Lista dokumentów do akceptacji jest nieprawidłowa.',
            details: error.details,
          };
        }
        case 'NotFoundError': {
          return {
            type: 'DocumentNotFound',
            message: 'Żądany dokument nie został znaleziony.',
            details: error.details,
          };
        }
        default: {
          return {
            type: 'GenericApiError',
            message: 'Wystąpił błąd podczas akceptowania dokumentów prawnych.',
            details: error.details,
          };
        }
      }
    });
}

export async function getLegalConsentStatusService(
  requestOptions?: RequestInit
): Promise<Result<ConsentStatusResult, LegalDomainError>> {
  const result = await legalApiClient.get<ConsentStatusResult>('/status', requestOptions);

  return result
    .map((response) => response.data)
    .mapErr((error): LegalDomainError => {
      switch (error.type) {
        case 'UnauthorizedError': {
          return {
            type: 'Unauthorized',
            message: 'Musisz być zalogowany, aby sprawdzić status zgód.',
            details: error.details,
          };
        }
        default: {
          return {
            type: 'GenericApiError',
            message: 'Wystąpił błąd podczas sprawdzania statusu zgód prawnych.',
            details: error.details,
          };
        }
      }
    });
}
