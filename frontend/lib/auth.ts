import { api } from './api';

const AUTH_PREFIX = '/api/Auth';

interface RegisterInput {
  email: string;
  password: string;
  confirmPassword: string;
  marketingConsent?: boolean;
}

interface LoginInput {
  email: string;
  password: string;
}

interface ForgotPasswordInput {
  email: string;
}

interface ResetPasswordInput {
  email: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
}

interface ValidateTokenInput {
  token: string;
  email: string;
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

export const registerUser = async ({
  email,
  password,
  confirmPassword,
  marketingConsent,
}: RegisterInput) => {
  const response = await api.post(`${AUTH_PREFIX}/register`, {
    email,
    password,
    confirmPassword,
    acceptMarketingConsent: marketingConsent ?? false,
  });
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

export const forgotPassword = async ({ email }: ForgotPasswordInput) => {
  const response = await api.post(`${AUTH_PREFIX}/forgot-password`, { email });
  return response.data;
};

export const validateResetToken = async ({ token, email }: ValidateTokenInput) => {
  const response = await api.get(`${AUTH_PREFIX}/validate-reset-token`, {
    params: { token, email },
  });
  return response.data;
};

export const resetPassword = async ({
  email,
  token,
  newPassword,
  confirmPassword,
}: ResetPasswordInput) => {
  const response = await api.post(`${AUTH_PREFIX}/reset-password`, {
    email,
    token,
    newPassword,
    confirmPassword,
  });
  return response.data;
};
