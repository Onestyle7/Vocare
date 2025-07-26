import { api } from './api';

const AUTH_PREFIX = '/api/auth';

interface RegisterInput {
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

// Interceptor z debugowaniem
api.interceptors.request.use(
  (config) => {
    console.log('🔧 [API Request] Wysyłanie żądania:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL || ''}${config.url}`,
      headers: config.headers,
      data: config.data ? (typeof config.data === 'string' ? config.data : JSON.stringify(config.data)) : 'brak danych',
      timeout: config.timeout
    });
    return config;
  },
  (error) => {
    console.error('❌ [API Request Error]:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('✅ [API Response] Otrzymano odpowiedź:', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      method: response.config.method?.toUpperCase(),
      headers: response.headers,
      data: response.data,
      dataSize: JSON.stringify(response.data).length + ' znaków'
    });
    return response;
  },
  (error) => {
    console.error('❌ [API Response Error] Błąd odpowiedzi:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      responseHeaders: error.response?.headers,
      responseData: error.response?.data,
      requestData: error.config?.data,
      code: error.code,
      stack: error.stack
    });

    const isLoginRoute = error.config?.url?.includes(`${AUTH_PREFIX}/login`);
    if (error.response?.status === 401 && !isLoginRoute) {
      console.log('🔧 [API] 401 error detected, clearing token and redirecting...');
      localStorage.removeItem('token');
      window.location.href = '/sign-in';
    }
    return Promise.reject(error);
  }
);

export const registerUser = async ({ email, password }: RegisterInput) => {
  console.log('🔧 [Auth] Rozpoczęcie rejestracji użytkownika:', { email, hasPassword: !!password });
  try {
    const response = await api.post(`/register`, { email, password });
    console.log('✅ [Auth] Rejestracja pomyślna');
    return response.data;
  } catch (error) {
    console.error('❌ [Auth] Błąd rejestracji:', error);
    throw error;
  }
};

export const loginUser = async ({ email, password }: LoginInput) => {
  console.log('🔧 [Auth] Rozpoczęcie logowania użytkownika:', { email, hasPassword: !!password });
  try {
    const response = await api.post(`/login`, { email, password });
    console.log('✅ [Auth] Logowanie pomyślne, sprawdzanie tokenu...');
    
    const token = response.data.token;
    console.log('🔧 [Auth] Token z odpowiedzi:', { hasToken: !!token, tokenType: typeof token });
    
    if (token) {
      localStorage.setItem('token', token);
      console.log('✅ [Auth] Token zapisany w localStorage');
    } else {
      console.warn('⚠️ [Auth] Brak tokenu w odpowiedzi');
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ [Auth] Błąd logowania:', error);
    throw error;
  }
};

export const logoutUser = async () => {
  console.log('🔧 [Auth] Rozpoczęcie wylogowania użytkownika');
  try {
    await api.post(`${AUTH_PREFIX}/logout`);
    console.log('✅ [Auth] Wylogowanie pomyślne na serwerze');
  } catch (error) {
    console.warn('⚠️ [Auth] Błąd podczas wylogowania na serwerze (ignorowany):', error);
  } finally {
    console.log('🔧 [Auth] Czyszczenie localStorage i przekierowanie');
    localStorage.removeItem('token');
    window.location.href = '/sign-in';
  }
};

export const googleVerify = async (accessToken: string) => {
  console.log('🔧 [Auth] Rozpoczęcie weryfikacji Google token');
  console.log('🔧 [Auth] Access token info:', {
    hasToken: !!accessToken,
    tokenLength: accessToken?.length,
    tokenStart: accessToken?.substring(0, 20) + '...',
    tokenType: typeof accessToken
  });

  try {
    console.log('🔧 [Auth] Wysyłanie żądania weryfikacji Google...');
    const response = await api.post('/api/Auth/google-verify', { accessToken });
    
    console.log('✅ [Auth] Google weryfikacja - odpowiedź otrzymana');
    console.log('🔧 [Auth] Response details:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data
    });

    console.log('🔧 [Auth] Szukanie tokenu w odpowiedzi...');
    const token = 
      response.data.token ||
      response.data.accessToken ||
      response.headers['authorization']?.replace('Bearer ', '');

    console.log('🔧 [Auth] Token extraction results:', {
      fromDataToken: !!response.data.token,
      fromDataAccessToken: !!response.data.accessToken,
      fromAuthHeader: !!response.headers['authorization'],
      finalToken: !!token,
      tokenType: typeof token
    });

    if (token) {
      console.log('✅ [Auth] Token znaleziony, zapisywanie do localStorage');
      localStorage.setItem('token', token);
    } else {
      console.warn('⚠️ [Auth] Nie znaleziono tokenu w odpowiedzi Google verify');
    }

    return response.data;
  } catch (error) {
    console.error('❌ [Auth] Błąd podczas weryfikacji Google:', error);
    
    if (error instanceof Error) {
      console.error('❌ [Auth] Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    
    throw error;
  }
};