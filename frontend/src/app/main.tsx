import { ApolloProvider } from '@apollo/client/react';
import { ThemeProvider } from '@app/components/ThemeProvider';
import { apolloClient } from '@app/lib/apollo';
import { store } from '@app/store';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { App } from './App';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <ApolloProvider client={apolloClient}>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </ApolloProvider>
      </ThemeProvider>
    </Provider>
  </React.StrictMode>,
);
