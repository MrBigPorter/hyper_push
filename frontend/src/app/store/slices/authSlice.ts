// ==========================================
// HyperPush — Auth Redux Slice
// 仅管理状态，不含 GraphQL 调用
//（GraphQL login/register mutation 由你写）
// ==========================================

import type { AuthState, User } from '@app/types';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const AUTH_TOKEN_KEY = 'hyperpush_token';

/** 从 localStorage 恢复 token */
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
    /** 开始登录/注册 (设置 loading) */
    authStart(state) {
      state.isLoading = true;
      state.error = null;
    },

    /** 登录/注册成功 (保存 token + user) */
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

    /** 2FA 需要验证 (密码正确但需 TOTP) */
    setRequires2fa(state, action: PayloadAction<{ tempToken: string; user: User }>) {
      state.token = null;
      state.user = action.payload.user;
      state.requires2fa = true;
      state.tempToken = action.payload.tempToken;
      state.isLoading = false;
      state.error = null;
    },

    /** 登录/注册失败 */
    authFailure(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.error = action.payload;
    },

    /** 加载当前用户成功 */
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.isLoaded = true;
    },

    /** 登出 */
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

    /** 清除错误 */
    clearError(state) {
      state.error = null;
    },
  },
});

export const { authStart, authSuccess, authFailure, setUser, logout, clearError, setRequires2fa } =
  authSlice.actions;

export default authSlice.reducer;
