import { UserProfile } from '@/lib/types/profile';
import { api } from './api';

const PREFIX = '/api/UserProfile';

export const getUserProfile = async (token: string): Promise<UserProfile> => {
  const { data } = await api.get(
    `${PREFIX}/GetCurrentUserProfile`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};

export const createUserProfile = async (
  profile: UserProfile,
  token: string
): Promise<UserProfile> => {
  const { data } = await api.post(
    `${PREFIX}/CreateCurrentUserProfile`,
    profile,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};

export const updateUserProfile = async (
  profile: UserProfile,
  token: string
): Promise<UserProfile> => {
  const { data } = await api.put(
    `${PREFIX}/UpdateCurrentUserProfile`,
    profile,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};

export const deleteUserProfile = async (token: string): Promise<void> => {
  await api.delete(
    `${PREFIX}/DeleteCurrentUserProfile`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
};
