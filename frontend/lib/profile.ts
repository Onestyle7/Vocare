import { UserProfile } from '@/lib/types/profile';
import { api } from './api';

const PREFIX = '/api/UserProfile';

export const getUserProfile = async (): Promise<UserProfile> => {
  const { data } = await api.get(`${PREFIX}/GetCurrentUserProfile`);
  return data;
};

export const createUserProfile = async (
  profile: UserProfile
): Promise<UserProfile> => {
  const { data } = await api.post(`${PREFIX}/CreateCurrentUserProfile`, profile);
  return data;
};

export const updateUserProfile = async (
  profile: UserProfile
): Promise<UserProfile> => {
  const { data } = await api.put(`${PREFIX}/UpdateCurrentUserProfile`, profile);
  return data;
};

export const deleteUserProfile = async (): Promise<void> => {
  await api.delete(`${PREFIX}/DeleteCurrentUserProfile`);
};
