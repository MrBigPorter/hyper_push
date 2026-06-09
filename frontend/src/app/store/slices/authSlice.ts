// ==========================================
// HyperPush — Auth Redux Slice
// State management only, no GraphQL calls
// (GraphQL login/register mutations are handled elsewhere)
// ==========================================

import type { AuthState, User } from '@app/types';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const AUTH_TOKEN_KEY = 'hyperpush_token';

/** Restore token from localStorage */
function loadToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

const initialState: AuthState = {
  token: loadToken(),
  user: null,
  requires2fa: false,
  tempToken: null,
  // Token is loaded synchronously from localStorage, no async check needed
  isLoaded: true,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Start login/register (set loading) */
    authStart(state) {
      state.isLoading = true;
      state.error = null;
    },

    /** Login/register success (save token + user) */
    authSuccess(state, action: PayloadAction<{ token: string; user: User }>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.requires2fa = false;
      state.tempToken = null;
      state.isLoading = false;
      state.isLoaded = true;
      state.error = null;
      localStorage.setItem(AUTH_TOKEN_KEY, action.payload.token);
    },

    /** 2FA verification required (password correct, TOTP needed) */
    setRequires2fa(state, action: PayloadAction<{ tempToken: string; user: User }>) {
      state.token = null;
      state.user = action.payload.user;
      state.requires2fa = true;
      state.tempToken = action.payload.tempToken;
      state.isLoading = false;
      state.error = null;
    },

    /** Login/register failure */
    authFailure(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.error = action.payload;
    },

    /** Load current user success */
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.isLoaded = true;
    },

    /** Logout */
    logout(state) {
      state.token = null;
      state.user = null;
      state.requires2fa = false;
      state.tempToken = null;
      state.isLoaded = true;
      state.isLoading = false;
      state.error = null;
      localStorage.removeItem(AUTH_TOKEN_KEY);
    },

    /** Clear error */
    clearError(state) {
      state.error = null;
    },
  },
});

export const { authStart, authSuccess, authFailure, setUser, logout, clearError, setRequires2fa } =
  authSlice.actions;

export default authSlice.reducer;
