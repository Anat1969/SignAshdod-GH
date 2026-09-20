import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let active = true;

    const loadUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!active) return;
        if (session) {
          const currentUser = await base44.auth.me();
          if (!active) return;
          setUser(currentUser);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        if (active) {
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (active) setIsLoadingAuth(false);
      }
    };

    loadUser();

    // React to sign-in / sign-out (including the OAuth redirect coming back).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session) {
        base44.auth.me()
          .then((u) => { if (active) { setUser(u); setIsAuthenticated(true); } })
          .catch(() => { if (active) { setUser(null); setIsAuthenticated(false); } })
          .finally(() => { if (active) setIsLoadingAuth(false); });
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
      }
    });

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, []);

  const navigateToLogin = () => {
    base44.auth.redirectToLogin();
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    base44.auth.logout(shouldRedirect ? window.location.href : undefined);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      // Kept for API compatibility with the previous Base44 auth flow.
      isLoadingPublicSettings: false,
      authError,
      appPublicSettings: null,
      logout,
      navigateToLogin,
      signInWithGoogle: navigateToLogin,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
