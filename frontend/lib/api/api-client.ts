import 'server-only';

import { err, ok, Result } from 'neverthrow';
import { cookies } from 'next/headers';

import env from '../env/server';
import { BaseAppError } from '../types/result';

interface ApiConfig {
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
  timeout?: number;
}
interface ApiResponse<T> {
  success: true;
  data: T;
  status: number;
  headers: Headers;
}

export type ApiError = BaseAppError<
  | 'BadRequestError'
  | 'UnauthorizedError'
  | 'ForbiddenError'
  | 'NotFoundError'
  | 'ConflictError'
  | 'UnprocessableEntityError'
  | 'TooManyRequestsError'
  | 'InternalServerError'
  | 'BadGatewayError'
  | 'ServiceUnavailableError'
  | 'GatewayTimeoutError'
  | 'UnexpectedApiError'
  | 'ParseResponseError'
  | `HttpError${number}`
>;

export class ApiClient {
  private config: Required<ApiConfig>;

  constructor(config: ApiConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || '',
      defaultHeaders: {
        'Content-Type': 'application/json',
        ...config.defaultHeaders,
      },
      timeout: config.timeout || 10000,
    };
  }

  async get<T>(endpoint: string, options?: RequestInit) {
    return this.makeRequest<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T, D = unknown>(endpoint: string, data?: D, options?: RequestInit) {
    const isFormData = data instanceof FormData;
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: isFormData ? data : data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T, D = unknown>(endpoint: string, data?: D, options?: RequestInit) {
    const isFormData = data instanceof FormData;
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: isFormData ? data : data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit) {
    return this.makeRequest<T>(endpoint, { ...options, method: 'DELETE' });
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Result<ApiResponse<T>, ApiError>> {
    const url = this.buildUrl(endpoint);
    const requestOptions = await this.buildRequestOptions(options);

    try {
      console.log('REQUEST_LOGGER', requestOptions);
      const response = await fetch(url, {
        ...requestOptions,
      });

      if (!response.ok) {
        const error = await this.handleErrorResponse(response);
        console.log('ERROR_LOGGER', error);
        return error;
      }

      const parseResult = await this.parseResponse<T>(response);

      if (parseResult.isErr()) {
        return err(parseResult.error);
      }

      console.log('RESPONSE_LOGGER', parseResult);

      return ok({
        success: true,
        data: parseResult.value,
        status: response.status,
        headers: response.headers,
      });
    } catch (error: unknown) {
      if (error instanceof Error) console.log('ERROR_LOGGER', error.cause);
      return err({
        type: 'UnexpectedApiError',
        message: 'Niespodziewany błąd po stronie servera',
      });
    }
  }

  private async handleErrorResponse(response: Response): Promise<Result<never, ApiError>> {
    let errorDetails: Record<string, unknown> | undefined = undefined;

    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        errorDetails = await response.json();
      }
    } catch {}

    const statusCode = response.status;

    switch (statusCode) {
      case 400:
        return err({
          type: 'BadRequestError',
          message: 'Błędne żądanie - sprawdź poprawność wysłanych danych',
          details: errorDetails,
        });
      case 401:
        return err({
          type: 'UnauthorizedError',
          message: 'Nie jesteś zalogowany - zaloguj się, aby kontynuować',
          details: errorDetails,
        });
      case 403:
        return err({
          type: 'ForbiddenError',
          message: 'Brak dostępu do tego zasobu',
          details: errorDetails,
        });
      case 404:
        return err({
          type: 'NotFoundError',
          message: 'Żądany zasób nie został znaleziony',
          details: errorDetails,
        });
      case 409:
        return err({
          type: 'ConflictError',
          message: 'Konflikt - zasób już istnieje lub stan jest niezgodny',
          details: errorDetails,
        });
      case 422:
        return err({
          type: 'UnprocessableEntityError',
          message: 'Nie można przetwarzać żądania - dane są niezgodne ze schematem',
          details: errorDetails,
        });
      case 429:
        return err({
          type: 'TooManyRequestsError',
          message: 'Zbyt wiele żądań - spóbuj ponownie za chwilę',
          details: errorDetails,
        });
      case 500:
        return err({
          type: 'InternalServerError',
          message: 'Błąd wewnętrzny serwera',
          details: errorDetails,
        });
      case 502:
        return err({
          type: 'BadGatewayError',
          message: 'Serwer tymczasowo niedostępny',
          details: errorDetails,
        });
      case 503:
        return err({
          type: 'ServiceUnavailableError',
          message: 'Serwis tymczasowo niedostępny - spóbuj ponownie za chwilę',
          details: errorDetails,
        });
      case 504:
        return err({
          type: 'GatewayTimeoutError',
          message: 'Przekroczono czas oczekiwania na odpowiedź serwera',
          details: errorDetails,
        });
      default:
        return err({
          type: `HttpError${statusCode}`,
          message: `HTTP ${statusCode}: ${response.statusText}`,
          details: errorDetails,
        });
    }
  }

  private async parseResponse<T>(response: Response): Promise<Result<T, ApiError>> {
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      try {
        const data = await response.json();
        return ok(data as T);
      } catch {
        return err({
          type: 'ParseResponseError',
          message: 'Błąd podczas przetwarzania odpowiedzi z servera',
        });
      }
    }

    try {
      const data = (await response.text()) as unknown as T;
      return ok(data);
    } catch {
      return err({
        type: 'ParseResponseError',
        message: 'Błąd podczas odczytu tekstu z odpowiedzi z servera',
      });
    }
  }

  private buildUrl(endpoint: string): string {
    if (endpoint.startsWith('http')) {
      return endpoint;
    }
    return `${this.config.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  }

  private async buildRequestOptions(options: RequestInit): Promise<RequestInit> {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    const headers: Record<string, string> = {
      ...this.config.defaultHeaders,
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    return {
      ...options,
      headers,
    };
  }
}

export const apiClient = new ApiClient({ baseUrl: env.API_BASE_URL });
