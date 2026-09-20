import React, { createContext, useState, useContext, useEffect } from 'react';
import { account } from '@/api/appwriteClient';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let active = true;

    const init = async () => {
      try {
        // OAuth token flow: after Google redirect we return with ?userId=&secret=.
        // Exchange them for a session, then strip them from the URL.
        const params = new URLSearchParams(window.location.search);
        const userId = params.get('userId');
        const secret = params.get('secret');
        if (userId && secret) {
          try {
            await account.createSession(userId, secret);
          } catch (e) {
            console.error('OAuth session exchange failed:', e);
          }
          params.delete('userId');
          params.delete('secret');
          const qs = params.toString();
          const clean = window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash;
          window.history.replaceState({}, document.title, clean);
        }

        const currentUser = await base44.auth.me();
        if (!active) return;
        setUser(currentUser);
        setIsAuthenticated(true);
      } catch {
        if (!active) return;
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        if (active) setIsLoadingAuth(false);
      }
    };

    init();
    return () => { active = false; };
  }, []);

  const navigateToLogin = () => {
    base44.auth.redirectToLogin();
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    base44.auth.logout();
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      // Kept for API compatibility with the previous auth flow.
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
