import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

interface RegisterInput {
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export const registerUser = async ({ email, password }: RegisterInput) => {
  const response = await axios.post(`${API_URL}/register`, { email, password });
  return response.data;
};

export const loginUser = async ({ email, password }: LoginInput) => {
  const response = await axios.post(`${API_URL}/login`, { email, password });
  const token = response.data.token;
  if (token) {
    localStorage.setItem('token', token);
  }
  return response.data;
};

export const logoutUser = () => {
  localStorage.removeItem('token');
};
