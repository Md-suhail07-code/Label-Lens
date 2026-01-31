import React, { createContext, useContext, useState, useEffect } from 'react';

const STORAGE_KEY = 'label-lens-profile';

const defaultProfile = {
  user: null,
  onboardingComplete: false,
};

const UserProfileContext = createContext();

export const UserProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return defaultProfile;
        }
      }
    }
    return defaultProfile;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  const updateProfile = (updates) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  const completeOnboarding = () => {
    setProfile((prev) => ({ ...prev, onboardingComplete: true }));
  };

  const logout = () => {
    setProfile(defaultProfile);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('accessToken');
  };

  return (
    <UserProfileContext.Provider
      value={{
        profile,
        user: profile.user,
        updateProfile,
        completeOnboarding,
        logout,
      }}
    >
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
};