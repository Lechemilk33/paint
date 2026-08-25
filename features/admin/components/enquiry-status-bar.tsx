'use client';

import { cn } from '@/lib/utils';
import {
  ENQUIRY_STATUS_LABEL,
  enquiryStatusSchema,
  type EnquiryStatus,
} from '@/lib/enquiries/schema';
import { setEnquiryStatusAction } from '../enquiry-actions';

/**
 * The enquiry's state, as a row of one-tap buttons rather than a dropdown.
 *
 * There are four states and the whole point is to change them quickly while
 * working through an inbox; a select would put two interactions between the
 * studio and "replied". Each button is its own form, so this works before
 * hydration too.
 */
export function EnquiryStatusBar({
  enquiryId,
  status,
}: {
  enquiryId: string;
  status: EnquiryStatus;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground text-xs">Status</span>
      {enquiryStatusSchema.options.map((option) => {
        const isCurrent = option === status;
        return (
          <form key={option} action={setEnquiryStatusAction}>
            <input type="hidden" name="id" value={enquiryId} />
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
              {ENQUIRY_STATUS_LABEL[option]}
            </button>
          </form>
        );
      })}
    </div>
  );
}
