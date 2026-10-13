import 'server-only';

import { err, ok, Result } from 'neverthrow';
import { cookies, headers } from 'next/headers';

import env from '../env/server';
import { Logger } from '../logger';
import { BaseAppError, BaseAppErrorDetails } from '../types/result';

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

  async patch<T, D = unknown>(endpoint: string, data?: D, options?: RequestInit) {
    const isFormData = data instanceof FormData;
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: isFormData ? data : data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T, D = unknown>(endpoint: string, data?: D, options?: RequestInit) {
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Result<ApiResponse<T>, ApiError>> {
    const url = this.buildUrl(endpoint);
    const requestOptions = await this.buildRequestOptions(options);

    try {
      Logger.debug('[REQUEST LOGGER]', { url, ...requestOptions });
      const response = await fetch(url, {
        ...requestOptions,
      });

      if (!response.ok) {
        Logger.debug('[RAW ERROR]', response);
        const error = await this.handleErrorResponse(response);
        Logger.error(...error, { url });
        return error;
      }

      const parseResult = await this.parseResponse<T>(response);

      if (parseResult.isErr()) {
        return err(parseResult.error);
      }

      Logger.debug('[RESPONSE LOGGER]', parseResult);

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
    let errorDetails: BaseAppErrorDetails | undefined = undefined;

    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('json')) {
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

    const requestHeaders: Record<string, string> = {
      ...this.config.defaultHeaders,
      ...(await this.getClientInfoHeaders()),
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    if (options.body instanceof FormData) {
      delete requestHeaders['Content-Type'];
    }

    return {
      ...options,
      headers: requestHeaders,
    };
  }

  /**
   * Forwards the browser's IP and User-Agent to the API, which would otherwise only see
   * this server. The backend trusts these headers only together with the internal API key.
   */
  private async getClientInfoHeaders(): Promise<Record<string, string>> {
    const incomingHeaders = await headers();
    const clientIp =
      incomingHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      incomingHeaders.get('x-real-ip');
    const clientUserAgent = incomingHeaders.get('user-agent');

    const clientInfoHeaders: Record<string, string> = {
      'X-Internal-Api-Key': env.INTERNAL_API_KEY,
    };

    if (clientIp) {
      clientInfoHeaders['X-Client-IP'] = clientIp;
    }

    if (clientUserAgent) {
      clientInfoHeaders['X-Client-User-Agent'] = clientUserAgent;
    }

    return clientInfoHeaders;
  }
}

export const apiClient = new ApiClient({ baseUrl: env.API_BASE_URL });
