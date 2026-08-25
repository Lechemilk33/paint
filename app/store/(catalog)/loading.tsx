import { Skeleton } from '@/components/ui/skeleton';

export default function StoreLoading() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-5 pt-16 sm:px-8">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-7 w-56 rounded-none" />
          <Skeleton className="h-32 w-full rounded-none" />
          <Skeleton className="h-16 w-full max-w-lg rounded-none" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-40 rounded-none" />
            <Skeleton className="h-10 w-44 rounded-none" />
          </div>
        </div>
        <Skeleton className="aspect-square w-full rounded-none" />
      </div>

      <div className="flex flex-col gap-8">
        <Skeleton className="h-10 w-64 rounded-none" />
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-3">
              <Skeleton className="aspect-square w-full rounded-none" />
              <Skeleton className="h-5 w-2/3 rounded-none" />
              <Skeleton className="h-4 w-1/3 rounded-none" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
