'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { User } from 'firebase/auth';
// Import as a module to prevent build errors
import * as fbAuth from 'firebase/auth';
import { auth, isFirebaseInitialized } from '@/lib/firebase';
import { BoomnLogo } from '@/components/boomn-logo';
import { usePathname, useRouter } from 'next/navigation';

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isFirebaseInitialized || !auth) {
      setLoading(false);
      return;
    }

    if (fbAuth.isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        email = window.prompt('Please provide your email for confirmation');
      }
      if (email) {
        fbAuth.signInWithEmailLink(auth, email, window.location.href)
          .catch((error) => {
            console.error('Failed to sign in with email link', error);
          })
          .finally(() => {
            router.replace(pathname);
          });
      }
    }

    const unsubscribe = fbAuth.onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  const isAuthPage = pathname === '/login' || pathname === '/signup';

  useEffect(() => {
    // This effect handles redirection after auth state is confirmed.
    if (loading) return;

    if (!user && !isAuthPage) {
      router.push('/login');
    } else if (user && isAuthPage) {
      router.push('/');
    }
  }, [user, loading, pathname, router, isAuthPage]);


  const value = { user, loading };

  // This logic prevents rendering a protected page to an unauthenticated user,
  // even for a split second before the redirect effect runs.
  const canRenderChildren = user || isAuthPage;
  if (loading || !canRenderChildren) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-background">
        <BoomnLogo className="w-24 h-24 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
