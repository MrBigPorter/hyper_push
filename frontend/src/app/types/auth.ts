// ==========================================
// HyperPush — Auth Types
// Strict types, zero any
// ==========================================

import type { User } from './models';

/** Login input */
export interface LoginInput {
  email: string;
  password: string;
}

/** Register input */
export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

/** Auth response (login / register / verify2fa) */
export interface AuthResponse {
  /** Full JWT token (null during 2FA step) */
  token?: string;
  /** Current user */
  user?: User;
  /** Whether 2FA verification is required (after password login) */
  requires2fa?: boolean;
  /** Temporary token for 2FA verification step */
  tempToken?: string;
}

/** Auth state */
export interface AuthState {
  /** JWT token */
  token: string | null;
  /** Current user */
  user: User | null;
  /** 2FA verification required (after password login) */
  requires2fa: boolean;
  /** Temporary token for 2FA verification step */
  tempToken: string | null;
  /** Whether auth state has been loaded */
  isLoaded: boolean;
  /** Auth in progress */
  isLoading: boolean;
  /** Error message */
  error: string | null;
}
