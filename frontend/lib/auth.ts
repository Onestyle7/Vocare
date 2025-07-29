import { api } from './api';

const AUTH_PREFIX = '/api/Auth';

interface RegisterInput {
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

api.interceptors.response.use(
  response => response,
  error => {
    const isLoginRoute = error.config?.url?.includes(`${AUTH_PREFIX}/login`);

    if (error.response?.status === 401 && !isLoginRoute) {
      localStorage.removeItem('token');
      window.location.href = '/sign-in';
    }

    return Promise.reject(error);
  }
);

export const registerUser = async ({ email, password }: RegisterInput) => {
  const response = await api.post(`${AUTH_PREFIX}/register`, { email, password });
  return response.data;
};

export const loginUser = async ({ email, password }: LoginInput) => {
  const response = await api.post(`${AUTH_PREFIX}/login`, { email, password });
  const token = response.data.token;
  if (token) {
    localStorage.setItem('token', token);
  }
  return response.data;
};

export const logoutUser = async () => {
  try {
    await api.post(`${AUTH_PREFIX}/logout`);
  } catch {
    // Ignore any errors
  } finally {
    localStorage.removeItem('token');
    window.location.href = '/sign-in';
  }
};

export const googleVerify = async (accessToken: string) => {
  // tutaj można zostawić pełną ścieżkę lub użyć AUTH_PREFIX:
  const response = await api.post(`${AUTH_PREFIX}/google-verify`, { accessToken });
  const token =
    response.data.token ||
    response.data.accessToken ||
    response.headers['authorization']?.replace('Bearer ', '');

  if (token) {
    localStorage.setItem('token', token);
  }

  return response.data;
};
