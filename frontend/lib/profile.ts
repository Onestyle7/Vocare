import { UserProfile } from '@/lib/types/profile';
import axios from 'axios';

const BASE_API_URL = 'https://localhost:5001/api/UserProfile';

// GET: Retrieve the current user profile
export const getUserProfile = async (token: string) => {
  const response = await axios.get(`${BASE_API_URL}/GetCurrentUserProfile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// POST: Create a new user profile
export const createUserProfile = async (profile: UserProfile, token: string) => {
  const response = await axios.post(`${BASE_API_URL}/CreateCurrentUserProfile`, profile, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// PUT: Update the current user profile
export const updateUserProfile = async (profile: UserProfile, token: string) => {
  const response = await axios.put(`${BASE_API_URL}/UpdateCurrentUserProfile`, profile, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// DELETE: Delete the current user profile
export const deleteUserProfile = async (token: string) => {
  const response = await axios.delete(`${BASE_API_URL}/DeleteCurrentUserProfile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
