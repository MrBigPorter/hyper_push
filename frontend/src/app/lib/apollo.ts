// ==========================================
// HyperPush — Apollo Client Setup
// ==========================================

import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const AUTH_TOKEN_KEY = 'hyperpush_token';

/** 从 localStorage 读取 JWT token */
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

/** 保存 JWT token 到 localStorage */
export function setToken(token: string | null): void {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

/** 清除 token (登出) */
export function clearToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

const httpLink = createHttpLink({
  uri: '/graphql',
});

const authLink = setContext((_operation, { headers }) => {
  const token = getToken();
  return {
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
});

export const apolloClient = new ApolloClient({
  link: from([authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});
