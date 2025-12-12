import axios from 'axios';

import { API_BASE_URL } from './config';

export const api = axios.create({
  baseURL: API_BASE_URL,
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
