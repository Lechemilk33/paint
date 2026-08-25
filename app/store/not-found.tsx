import Link from 'next/link';
import { Button } from '@/components/ui/button';

/**
 * Shown when a slug does not resolve - a piece that was retitled, or one that
 * has been taken down. Living in the store segment means it renders inside the
 * shop's own chrome and palette rather than the framework default.
 */
export default function StoreNotFound() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col items-start gap-4 px-5 py-32 sm:px-8">
      <h1 className="font-poster text-3xl font-extrabold tracking-tight">That piece is not here</h1>
      <p className="text-muted-foreground max-w-md text-sm">
        It may have been retitled, sold and taken down, or the link may have a typo in it.
      </p>
      <Button asChild className="tracking-label rounded-none font-mono text-xs uppercase">
        <Link href="/store">Back to the work</Link>
      </Button>
    </div>
  );
}
