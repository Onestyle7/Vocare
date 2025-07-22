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
  const token = response.data.token;
  if (token) {
    localStorage.setItem('token', token);
  }
  return response.data;
};

export const verifyGoogleToken = async (accessToken: string) => {
  const response = await api.post(`/auth/google-verify`, { accessToken });
  const authHeader = response.headers['authorization'] as string | undefined;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice('Bearer '.length);
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