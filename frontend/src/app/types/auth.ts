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

/** Auth 响应 (login / register) */
export interface AuthResponse {
  token: string;
  user: User;
}

/** Auth 状态 */
export interface AuthState {
  /** JWT token */
  token: string | null;
  /** 当前用户 */
  user: User | null;
  /** 是否已加载过认证状态 */
  isLoaded: boolean;
  /** 认证进行中 */
  isLoading: boolean;
  /** 错误信息 */
  error: string | null;
}
