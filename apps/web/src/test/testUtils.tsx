import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { blotterTheme } from '../blotterTheme.js';
import { CurrentUserProvider } from '../blotter/CurrentUserProvider.js';

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

interface ProviderOptions {
  withCurrentUser?: boolean;
  queryClient?: QueryClient;
}

function TestProviders({
  children,
  withCurrentUser = false,
  queryClient,
}: {
  children: ReactNode;
} & ProviderOptions) {
  const client = queryClient ?? createTestQueryClient();
  const inner = withCurrentUser ? <CurrentUserProvider>{children}</CurrentUserProvider> : children;

  return (
    <ThemeProvider theme={blotterTheme}>
      <CssBaseline />
      <QueryClientProvider client={client}>{inner}</QueryClientProvider>
    </ThemeProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options: RenderOptions & ProviderOptions = {}
) {
  const { withCurrentUser, queryClient, ...renderOptions } = options;
  return render(ui, {
    wrapper: ({ children }) => (
      <TestProviders withCurrentUser={withCurrentUser} queryClient={queryClient}>
        {children}
      </TestProviders>
    ),
    ...renderOptions,
  });
}
