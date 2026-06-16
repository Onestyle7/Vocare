'use client';

import React, { createContext, useContext } from 'react';

import { UserProfile } from '@/lib/types/profile';

export interface ProfileContextType {
  profile: UserProfile | null;
  isProfileEmpty: boolean;
}

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  isProfileEmpty: true,
});

export const ProfileProvider = ({
  children,
  profile,
}: {
  children: React.ReactNode;
  profile: UserProfile | null;
}) => {
  return (
    <ProfileContext.Provider value={{ profile, isProfileEmpty: !profile }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfileContext = () => useContext(ProfileContext);
