import axios from "axios";

const API_URL = "https://localhost:5001";

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
  return response.data; 
};
