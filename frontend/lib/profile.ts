import { UserProfile } from "@/app/types/profile";
import axios from "axios";

const API_URL = "https://localhost:5001/api/UserProfile";

export const createUserProfile = async (profile: UserProfile, token: string) => {
  const response = await axios.post(API_URL, profile, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const getUserProfile = async (token: string) => {
    const response = await axios.get(API_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  };
  

export const updateUserProfile = async (profile: UserProfile, token: string) => {
  const response = await axios.put(API_URL, profile, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const deleteUserProfile = async (token: string) => {
  const response = await axios.delete(API_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
