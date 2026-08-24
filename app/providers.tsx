'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { getBrowserQueryClient } from '@/lib/query-client';

export function Providers({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={getBrowserQueryClient()}>{children}</QueryClientProvider>;
}
