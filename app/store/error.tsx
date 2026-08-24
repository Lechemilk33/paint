'use client';

import { CircleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function StoreError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col items-start gap-4 px-5 py-32 sm:px-8">
      <CircleAlert className="text-magenta size-8" strokeWidth={1.5} aria-hidden="true" />
      <h1 className="font-poster text-3xl font-extrabold tracking-tight">The wall went dark</h1>
      <p className="text-muted-foreground max-w-md text-sm">
        The catalog could not be loaded. Check your connection and try again.
      </p>
      <Button
        variant="outline"
        onClick={reset}
        className="border-voltage/50 text-voltage hover:bg-voltage/10 hover:text-voltage rounded-none font-mono text-xs tracking-label uppercase"
      >
        Try again
      </Button>
    </div>
  );
}
