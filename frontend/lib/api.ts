import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL!;
if (!API_URL) {
  throw new Error('❌ NEXT_PUBLIC_API_URL is not defined');
}

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

if (typeof window !== 'undefined') {
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
}
