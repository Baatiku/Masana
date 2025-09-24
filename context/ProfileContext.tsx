import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Profile } from '../types';

const LOCAL_STORAGE_PROFILE_KEY = 'kwararru-local-profile';

interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

export const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const createDefaultProfile = (): Profile => ({
    id: crypto.randomUUID(),
    theme: 'light',
    language: 'en',
    // Default to premium true for the local-only version to unlock all features
    is_premium: true, 
    // Set a high token balance for the local version
    token_balance: 999999, 
    full_name: '',
    avatar_url: '',
});


export const ProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedProfile = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
      if (storedProfile) {
        setProfile(JSON.parse(storedProfile));
      } else {
        const defaultProfile = createDefaultProfile();
        localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(defaultProfile));
        setProfile(defaultProfile);
      }
    } catch (error) {
      console.error("Failed to load profile from local storage:", error);
      // Create a fallback profile if storage fails
      setProfile(createDefaultProfile());
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = async (updates: Partial<Omit<Profile, 'id'>>) => {
    if (!profile) throw new Error("No profile to update");
    
    const oldProfile = { ...profile };
    const updatedProfile = { ...profile, ...updates };
    setProfile(updatedProfile); 
    
    try {
        localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updatedProfile));
    } catch (error) {
        console.error("Failed to save profile to local storage:", error);
        setProfile(oldProfile); // Rollback on error
        throw error;
    }
  };

  const value: ProfileContextType = {
    profile,
    loading,
    updateProfile,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};