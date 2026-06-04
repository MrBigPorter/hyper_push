// ==========================================
// HyperPush — Auth Types
// 严格类型，零 any
// ==========================================

import type { User } from './models';

/** 登录输入 */
export interface LoginInput {
  email: string;
  password: string;
}

/** 注册输入 */
export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

/** Auth 响应 (login / register / verify2fa) */
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

/** Auth 状态 */
export interface AuthState {
  /** JWT token */
  token: string | null;
  /** 当前用户 */
  user: User | null;
  /** 2FA verification required (after password login) */
  requires2fa: boolean;
  /** Temporary token for 2FA verification step */
  tempToken: string | null;
  /** 是否已加载过认证状态 */
  isLoaded: boolean;
  /** 认证进行中 */
  isLoading: boolean;
  /** 错误信息 */
  error: string | null;
}
