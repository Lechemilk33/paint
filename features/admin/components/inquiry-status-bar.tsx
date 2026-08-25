'use client';

import { cn } from '@/lib/utils';
import {
  INQUIRY_STATUS_LABEL,
  inquiryStatusSchema,
  type InquiryStatus,
} from '@/lib/inquiries/schema';
import { setInquiryStatusAction } from '../inquiry-actions';

/**
 * The inquiry's state, as a row of one-tap buttons rather than a dropdown.
 *
 * There are four states and the whole point is to change them quickly while
 * working through an inbox; a select would put two interactions between the
 * studio and "replied". Each button is its own form, so this works before
 * hydration too.
 */
export function InquiryStatusBar({
  inquiryId,
  status,
}: {
  inquiryId: string;
  status: InquiryStatus;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground text-xs">Status</span>
      {inquiryStatusSchema.options.map((option) => {
        const isCurrent = option === status;
        return (
          <form key={option} action={setInquiryStatusAction}>
            <input type="hidden" name="id" value={inquiryId} />
            <input type="hidden" name="status" value={option} />
            <button
              type="submit"
              aria-pressed={isCurrent}
              disabled={isCurrent}
              className={cn(
                'focus-visible:ring-ring rounded-md border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none',
                isCurrent
                  ? 'border-primary bg-primary text-primary-foreground cursor-default'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {INQUIRY_STATUS_LABEL[option]}
            </button>
          </form>
        );
      })}
    </div>
  );
}
