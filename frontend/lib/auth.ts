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
  const response = await api.post('/api/Auth/google-verify', { accessToken });
  const token =
    response.data.token ||
    response.data.accessToken ||
    response.headers['authorization']?.replace('Bearer ', '');

  if (token) {
    localStorage.setItem('token', token);
  }

  return response.data;
};

export const requestPasswordReset = async (email: string) => {
  const { data } = await api.post(`${AUTH_PREFIX}/forgot-password`, { email });
  return data;
};

interface ResetPasswordInput {
  email: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export const resetPassword = async (payload: ResetPasswordInput) => {
  const { data } = await api.post(`${AUTH_PREFIX}/reset-password`, payload);
  return data;
};

export const validateResetToken = async (token: string, email: string) => {
  const { data } = await api.get(`${AUTH_PREFIX}/validate-reset-token`, {
    params: { token, email },
  });
  return data;
};
