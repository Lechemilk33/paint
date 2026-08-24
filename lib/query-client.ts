import { QueryClient, defaultShouldDehydrateQuery, isServer } from '@tanstack/react-query';
import { cache } from 'react';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000, // avoid instant client refetch after hydration
      },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
      },
    },
  });
}

/** One QueryClient per server request (React cache dedupes within a render). */
export const getQueryClient = cache(makeQueryClient);

let browserQueryClient: QueryClient | undefined;

/** Singleton QueryClient for the browser; fresh instance per request on the server. */
export function getBrowserQueryClient() {
  if (isServer) return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
