import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client with sensible defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't refetch on window focus in development
      refetchOnWindowFocus: false,
      // Retry failed requests once
      retry: 1,
      // Consider data stale after 30 seconds
      staleTime: 30 * 1000,
      // Cache data for 5 minutes
      gcTime: 5 * 60 * 1000,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
});

export function QueryProvider({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export { queryClient };
