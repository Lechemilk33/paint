import { Skeleton } from '@/components/ui/skeleton';

export default function PaintingLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-5 pt-10 sm:px-8">
      <Skeleton className="h-8 w-28 rounded-none" />
      <div className="mt-6 grid grid-cols-1 items-start gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <Skeleton className="aspect-square w-full rounded-none" />
        <div className="flex flex-col gap-6">
          <Skeleton className="h-6 w-40 rounded-none" />
          <Skeleton className="h-16 w-3/4 rounded-none" />
          <Skeleton className="h-12 w-full rounded-none" />
          <Skeleton className="h-9 w-32 rounded-none" />
          <Skeleton className="h-11 w-56 rounded-none" />
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-9 w-full rounded-none" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
