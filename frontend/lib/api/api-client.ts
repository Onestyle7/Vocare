import 'server-only';

import { cookies } from 'next/headers';
import env from '../env/server';

interface ApiConfig {
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
  timeout?: number;
}
interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

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

  async get<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T, D = unknown>(
    endpoint: string,
    data?: D,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T, D = unknown>(
    endpoint: string,
    data?: D,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'DELETE' });
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint);
    const requestOptions = await this.buildRequestOptions(options);

    try {
      console.log('REQUEST_LOGGER', requestOptions);
      const response = await fetch(url, {
        ...requestOptions,
      });

      if (!response.ok) {
        let errorDetails = undefined;
        try {
          errorDetails = await response.json();
        } catch {}
        throw new ApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorDetails
        );
      }

      const data = await this.parseResponse<T>(response);
      console.log('RESPONSE_LOGGER', data);

      return {
        data,
        status: response.status,
        headers: response.headers,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('RequestTimeout', 406);
      }
      throw error;
    }
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      try {
        return await response.json();
      } catch {
        throw new ApiError('Invalid JSON response', response.status, {
          internalReason: 'Failed to parse response body as JSON',
        });
      }
    }

    return (await response.text()) as unknown as T;
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
    console.log('TOKEN', token);

    return {
      ...options,
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...this.config.defaultHeaders,
        ...options.headers,
      },
    };
  }
}

export const apiClient = new ApiClient({ baseUrl: env.API_BASE_URL });
