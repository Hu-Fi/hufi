import { FC, PropsWithChildren } from 'react';

import { QueryClient, QueryClientProvider as ReactQueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      refetchOnMount: true,
      gcTime: 1_000 * 60 * 5, // 5 minutes
    },
    mutations: {
      retry: false,
    },
  },
});

const QueryClientProvider: FC<PropsWithChildren> = ({ children }) => {
  return (
    <ReactQueryClientProvider client={queryClient}>
      {children}
    </ReactQueryClientProvider>
  );
};

export default QueryClientProvider;
