// ==========================================
// HyperPush — Apollo Client Setup
// ==========================================

import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client';

const AUTH_TOKEN_KEY = 'hyperpush_token';

/** 从 localStorage 读取 JWT token */
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

const httpLink = new HttpLink({
  uri: import.meta.env.VITE_API_URL || '/graphql',
});

const authLink = new ApolloLink((operation, forward) => {
  const token = getToken();
  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }));
  return forward(operation);
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});
