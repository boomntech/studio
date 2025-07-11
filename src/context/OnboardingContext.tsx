'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getUserProfile, updateUserProfile } from '@/services/userService';
import { OnboardingDialog } from '@/components/onboarding-dialog';

interface OnboardingContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const checkOnboardingStatus = useCallback(async () => {
    if (!user) {
      setIsOpen(false);
      return;
    }
    
    const userProfile = await getUserProfile(user.uid);
    // Show the dialog if the profile exists but is not marked as complete.
    if (userProfile && !userProfile.profileCompleted) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [user]);

  useEffect(() => {
    // Wait for auth to finish loading before checking status.
    if (!authLoading) {
      checkOnboardingStatus();
    }
  }, [authLoading, checkOnboardingStatus]);

  const closeDialog = () => {
    setIsOpen(false);
  };
  
  const openDialog = () => {
    setIsOpen(true);
  }

  const value = {
    isOpen,
    open: openDialog,
    close: closeDialog,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      <OnboardingDialog />
    </OnboardingContext.Provider>
  );
};
