import { api } from './api';

interface RegisterInput {
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

if (typeof window !== 'undefined') {
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/sign-in';
      }
      return Promise.reject(error);
    }
  );
}

export const registerUser = async ({ email, password }: RegisterInput) => {
  const response = await api.post('/api/register', { email, password });
  return response.data;
};

export const loginUser = async ({ email, password }: LoginInput) => {
  const response = await api.post('/login', { email, password });
  const token = response.data.token;
  if (token) {
    localStorage.setItem('token', token);
  }
  return response.data;
};

export const logoutUser = () => {
  localStorage.removeItem('token');
  window.location.href = '/sign-in';
};
