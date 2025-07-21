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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRoute = error.config?.url?.includes(`${AUTH_PREFIX}/login`);

    if (error.response?.status === 401 && !isLoginRoute) {
      localStorage.removeItem('token');
      window.location.href = '/sign-in';
    }

    return Promise.reject(error);
  }
);

export const registerUser = async ({ email, password }: RegisterInput) => {
  const response = await api.post(`/register`, { email, password });
  return response.data;
};

export const loginUser = async ({ email, password }: LoginInput) => {
  const response = await api.post(`/login`, { email, password });

  // Try to retrieve token from common locations
  let token: string | undefined =
    response.data?.accessToken || response.data?.token;

  // Fallback to Authorization header used by ASP.NET Identity
  if (!token) {
    const authHeader = response.headers['authorization'] as string | undefined;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '');
    }
  }

  if (token) {
    localStorage.setItem('token', token);
  }

  return response.data;
};

export const logoutUser = async () => {
  try {
    await api.post(`${AUTH_PREFIX}/logout`);
  } catch {
  } finally {
    localStorage.removeItem('token');
    window.location.href = '/sign-in';
  }
};