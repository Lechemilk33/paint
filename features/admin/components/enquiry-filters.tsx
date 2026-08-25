'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  ENQUIRY_KIND_LABEL,
  ENQUIRY_STATUS_LABEL,
  enquiryKindSchema,
  enquiryStatusSchema,
} from '@/lib/enquiries/schema';

/**
 * Inbox filters, held in the URL rather than in component state.
 *
 * That makes a filtered inbox a link: it survives a reload, it can be
 * bookmarked as "everything still unanswered", and the back button behaves the
 * way it looks like it should.
 */
function Chip({
  isActive,
  onClick,
  children,
}: {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={cn(
        'focus-visible:ring-ring rounded-md border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none',
        isActive
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

export function EnquiryFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const status = params.get('status');
  const kind = params.get('kind');

  function apply(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value === null || next.get(key) === value) next.delete(key);
    else next.set(key, value);
    const query = next.toString();
    router.replace(query ? `/admin/enquiries?${query}` : '/admin/enquiries', { scroll: false });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by status">
        <Chip isActive={status === null} onClick={() => apply('status', null)}>
          All
        </Chip>
        {enquiryStatusSchema.options.map((option) => (
          <Chip key={option} isActive={status === option} onClick={() => apply('status', option)}>
            {ENQUIRY_STATUS_LABEL[option]}
          </Chip>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by kind">
        <Chip isActive={kind === null} onClick={() => apply('kind', null)}>
          Any kind
        </Chip>
        {enquiryKindSchema.options.map((option) => (
          <Chip key={option} isActive={kind === option} onClick={() => apply('kind', option)}>
            {ENQUIRY_KIND_LABEL[option]}
          </Chip>
        ))}
      </div>
    </div>
  );
}
