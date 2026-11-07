import React, { createContext, useContext } from 'react';

// No sign-in (2026-11-07, Anat: "תבטל את עיניין ההתחברות"): everyone who opens the app works as municipal staff.
const STAFF = { id: 'staff', email: '', full_name: 'צוות העירייה', role: 'admin' };
const value = { user: STAFF, isAuthenticated: true, isLoadingAuth: false, authError: null, logout: () => {}, reloadUser: async () => STAFF };
const AuthContext = createContext(value);

export const AuthProvider = ({ children }) => <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
export const useAuth = () => useContext(AuthContext);
